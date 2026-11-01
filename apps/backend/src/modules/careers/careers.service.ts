/**
 * Public careers data. Everything here is readable without signing in, so
 * it returns only published jobs and only public fields. Internal data such
 * as salary, hiring team, applicants and notes is never included.
 */
import { ApplicationSourceType, EmploymentType, PublicationChannel, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../database/prisma-client";
import { AppError } from "../../common/errors/app-error";
import { assertDocumentSignature } from "../../common/middlewares/document-upload.middleware";
import { getBranding } from "../organization/organization.service";
import { ingestApplication } from "../applications/applications.service";
import { parseStoredQuestions, validateAnswers } from "../applications/application-questions";
import { APPLICATION_CONSENT_VERSION, UTM_SOURCE_MAP } from "../distribution/distribution.constants";
import type { ApplyBody } from "./careers.validation";

type Channel = "careers" | "embed";

const channelEnum = (c?: Channel): PublicationChannel => (c === "embed" ? "WEBSITE_EMBED" : "CAREERS_PAGE");

/** Jobs that are open, within their deadline and published to the channel. */
const publishedJobWhere = (organizationId: string, channel: PublicationChannel): Prisma.JobWhereInput => ({
    organizationId,
    status: "OPEN",
    publications: { some: { channel, status: "PUBLISHED" } },
    OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
});

const PUBLIC_JOB_SELECT = {
    id: true,
    title: true,
    department: true,
    location: true,
    employmentType: true,
    experience: true,
    skills: true,
    numOpenings: true,
    applicationDeadline: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.JobSelect;

async function loadOrganization(slug: string) {
    const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, about: true } });
    if (!org) throw new AppError("Careers page not found", StatusCodes.NOT_FOUND);
    return org;
}

async function publicOrganization(org: { id: string; slug: string; name: string; about: string | null }) {
    const b = await getBranding(org.id);
    return {
        slug: org.slug,
        name: b.displayName,
        about: org.about,
        branding: {
            logoUrl: b.logoUrl,
            faviconUrl: b.faviconUrl,
            themePreset: b.themePreset,
            primaryColor: b.primaryColor,
            secondaryColor: b.secondaryColor,
            fontPreset: b.fontPreset,
            radiusPreset: b.radiusPreset,
            defaultAppearance: b.defaultAppearance,
        },
    };
}

export async function listJobs(
    slug: string,
    query: { q?: string; department?: string; location?: string; employmentType?: EmploymentType; channel?: Channel } = {}
) {
    const org = await loadOrganization(slug);
    const base = publishedJobWhere(org.id, channelEnum(query.channel));

    const where: Prisma.JobWhereInput = { AND: [base] };
    const and = where.AND as Prisma.JobWhereInput[];
    if (query.department) and.push({ department: { equals: query.department, mode: "insensitive" } });
    if (query.location) and.push({ location: { equals: query.location, mode: "insensitive" } });
    if (query.employmentType) and.push({ employmentType: query.employmentType });
    if (query.q) {
        and.push({
            OR: [
                { title: { contains: query.q, mode: "insensitive" } },
                { department: { contains: query.q, mode: "insensitive" } },
                { location: { contains: query.q, mode: "insensitive" } },
            ],
        });
    }

    const [jobs, facets] = await Promise.all([
        prisma.job.findMany({ where, select: PUBLIC_JOB_SELECT, orderBy: { createdAt: "desc" }, take: 200 }),
        // Filter options come from every published job, not just the filtered ones.
        prisma.job.findMany({ where: base, select: { department: true, location: true, employmentType: true } }),
    ]);

    const uniq = (xs: (string | null)[]) => [...new Set(xs.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));

    return {
        organization: await publicOrganization(org),
        jobs,
        filters: {
            departments: uniq(facets.map((f) => f.department)),
            locations: uniq(facets.map((f) => f.location)),
            employmentTypes: [...new Set(facets.map((f) => f.employmentType))],
        },
    };
}

export async function getJob(slug: string, jobId: string, channel?: Channel) {
    const org = await loadOrganization(slug);
    const job = await prisma.job.findFirst({
        where: { id: jobId, ...publishedJobWhere(org.id, channelEnum(channel)) },
        select: { ...PUBLIC_JOB_SELECT, description: true, applicationQuestions: true },
    });
    if (!job) throw new AppError("This job is no longer accepting applications", StatusCodes.NOT_FOUND);

    const { applicationQuestions, ...rest } = job;
    return {
        organization: await publicOrganization(org),
        job: { ...rest, questions: parseStoredQuestions(applicationQuestions) },
        consentVersion: APPLICATION_CONSENT_VERSION,
    };
}

/** Works out where a public application came from. */
export function resolveSource(body: Pick<ApplyBody, "channel" | "utm_source">): { type: ApplicationSourceType; name: string } {
    const utm = body.utm_source?.toLowerCase();
    const mapped = utm ? UTM_SOURCE_MAP[utm] : undefined;
    if (mapped === "LINKEDIN") return { type: "LINKEDIN", name: "LinkedIn" };
    if (mapped === "INDEED") return { type: "INDEED", name: "Indeed" };
    if (mapped === "NAUKRI") return { type: "NAUKRI", name: "Naukri" };
    if (mapped === "COMPANY_WEBSITE" || body.channel === "embed") return { type: "COMPANY_WEBSITE", name: "Company website" };
    if (utm) return { type: "OTHER", name: body.utm_source!.slice(0, 80) };
    return { type: "CAREERS_PAGE", name: "Robin Talent Careers" };
}

function hostOf(url?: string) {
    if (!url) return undefined;
    try {
        return new URL(url).host.slice(0, 200);
    } catch {
        return undefined;
    }
}

export async function apply(slug: string, jobId: string, body: ApplyBody, resume?: Express.Multer.File) {
    const org = await loadOrganization(slug);

    // Silently accept bot submissions caught by the honeypot without storing anything.
    if (body.website) return { status: "received" as const };

    if (resume) assertDocumentSignature(resume);

    const job = await prisma.job.findFirst({
        where: { id: jobId, ...publishedJobWhere(org.id, channelEnum(body.channel)) },
        select: { id: true, applicationQuestions: true },
    });
    if (!job) throw new AppError("This job is no longer accepting applications", StatusCodes.NOT_FOUND);

    const answers = validateAnswers(parseStoredQuestions(job.applicationQuestions), body.answers);
    const [firstName, ...rest] = body.fullName.split(/\s+/);
    const source = resolveSource(body);

    await ingestApplication({
        organizationId: org.id,
        jobId: job.id,
        applicant: {
            firstName,
            lastName: rest.join(" "),
            email: body.email,
            phone: body.phone,
            location: body.location,
            linkedinUrl: body.linkedinUrl,
            portfolioUrl: body.portfolioUrl,
        },
        source: {
            type: source.type,
            name: source.name,
            details: {
                channel: body.channel ?? "careers",
                utm_source: body.utm_source,
                utm_medium: body.utm_medium,
                utm_campaign: body.utm_campaign,
                utm_term: body.utm_term,
                utm_content: body.utm_content,
                referrerHost: hostOf(body.referrerUrl),
            },
        },
        coverLetter: body.coverLetter,
        answers,
        consent: { at: new Date(), version: body.consentVersion || APPLICATION_CONSENT_VERSION },
        resume: resume ?? null,
        actorId: null,
    });

    // Same response whether this is a new or repeat application, so the form
    // doesn't reveal whether an email has applied before.
    return { status: "received" as const };
}
