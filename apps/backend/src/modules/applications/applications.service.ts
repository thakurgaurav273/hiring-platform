/**
 * Application ingestion: the single entry point for every new application,
 * whatever its source (careers page, website embed, manual entry, referral,
 * and later the external API and job board imports).
 *
 * It enforces, in one place:
 *   - the job belongs to the organization the request is acting for,
 *   - candidate deduplication by normalized email within that organization,
 *   - one application per candidate per job (repeat submissions are idempotent),
 *   - source attribution recorded once and never overwritten,
 *   - résumé storage linked to both the candidate and the application.
 */
import { ApplicationSourceType, PipelineStage, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../database/prisma-client";
import { AppError } from "../../common/errors/app-error";
import { StorageFactory } from "../../common/services/storage/storage.factory";
import logger from "../../shared/logger/logger";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const SOURCE_LABELS: Record<ApplicationSourceType, string> = {
    CAREERS_PAGE: "Robin Talent Careers",
    COMPANY_WEBSITE: "Company website",
    LINKEDIN: "LinkedIn",
    INDEED: "Indeed",
    NAUKRI: "Naukri",
    EMPLOYEE_REFERRAL: "Employee referral",
    EMAIL: "Email",
    EXTERNAL_API: "External API",
    MANUAL: "Manual entry",
    OTHER: "Other",
};

export const sourceLabel = (type: ApplicationSourceType) => SOURCE_LABELS[type];

export interface ApplicantInput {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    summary?: string | null;
    skills?: string[];
    experience?: unknown;
    education?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
}

export interface ApplicationSourceInput {
    type: ApplicationSourceType;
    name?: string | null;
    externalId?: string | null;
    /** UTM / campaign parameters, landing page, etc. Stored as JSON. */
    details?: Record<string, unknown> | null;
    referredById?: string | null;
}

export interface IngestApplicationInput {
    organizationId: string;
    jobId: string;
    applicant: ApplicantInput;
    source: ApplicationSourceInput;
    coverLetter?: string | null;
    answers?: { id: string; label: string; answer: string }[];
    consent?: { at: Date; version: string } | null;
    resume?: Express.Multer.File | null;
    stage?: PipelineStage;
    /** User who entered it (manual entry, referral). Null for public submissions. */
    actorId?: string | null;
    /** Note to attach, e.g. the referrer's "why I suggest them". */
    note?: { content: string; authorId: string } | null;
}

export interface IngestResult {
    status: "created" | "duplicate";
    candidateId: string;
    applicationId: string;
    candidateCreated: boolean;
    jobTitle: string;
}

export async function ingestApplication(input: IngestApplicationInput): Promise<IngestResult> {
    const { organizationId, jobId, applicant, source } = input;

    // The job must belong to the organization. Never trust a job id alone.
    const job = await prisma.job.findFirst({
        where: { id: jobId, organizationId },
        select: { id: true, title: true, department: true, organizationId: true },
    });
    if (!job) {
        throw new AppError("Job not found", StatusCodes.NOT_FOUND);
    }

    if (source.referredById) {
        const referrer = await prisma.user.findFirst({
            where: { id: source.referredById, organizationId },
            select: { id: true },
        });
        if (!referrer) throw new AppError("Referrer not found", StatusCodes.BAD_REQUEST);
    }

    const emailNormalized = normalizeEmail(applicant.email);

    // An external id may only be imported once per job and source.
    if (source.externalId) {
        const existing = await prisma.application.findFirst({
            where: { jobId, sourceType: source.type, sourceExternalId: source.externalId },
            select: { id: true, candidateId: true },
        });
        if (existing) {
            return { status: "duplicate", candidateId: existing.candidateId, applicationId: existing.id, candidateCreated: false, jobTitle: job.title };
        }
    }

    // Store the résumé first (outside the transaction: it is an external write).
    let stored: { key: string } | null = null;
    if (input.resume) {
        stored = await StorageFactory.getService().uploadFile(
            input.resume.buffer,
            input.resume.originalname,
            input.resume.mimetype,
            `resumes/${organizationId}`
        );
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            let candidate = await tx.candidate.findUnique({
                where: { organizationId_emailNormalized: { organizationId, emailNormalized } },
                select: { id: true, phone: true, location: true, socialLinks: true, referredBy: true },
            });
            let candidateCreated = false;

            if (!candidate) {
                const socialLinks: Record<string, string> = {};
                if (applicant.linkedinUrl) socialLinks.linkedin = applicant.linkedinUrl;
                if (applicant.portfolioUrl) socialLinks.portfolio = applicant.portfolioUrl;
                candidate = await tx.candidate.create({
                    data: {
                        organizationId,
                        firstName: applicant.firstName.trim(),
                        lastName: (applicant.lastName ?? "").trim(),
                        email: applicant.email.trim(),
                        emailNormalized,
                        phone: applicant.phone || null,
                        location: applicant.location || null,
                        summary: applicant.summary || null,
                        skills: applicant.skills ?? [],
                        experience: (applicant.experience as Prisma.InputJsonValue) ?? undefined,
                        education: applicant.education ? [applicant.education] : undefined,
                        socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined,
                        // First-touch attribution on the profile; per-application source lives on Application.
                        source: sourceLabel(source.type),
                        referredBy: source.referredById ?? null,
                        referredOn: source.referredById ? new Date() : null,
                    },
                    select: { id: true, phone: true, location: true, socialLinks: true, referredBy: true },
                });
                candidateCreated = true;
            } else {
                // Fill gaps only. Never overwrite what the team already has.
                const links = (candidate.socialLinks as Record<string, string> | null) ?? {};
                const merged = { ...links };
                if (applicant.linkedinUrl && !links.linkedin) merged.linkedin = applicant.linkedinUrl;
                if (applicant.portfolioUrl && !links.portfolio) merged.portfolio = applicant.portfolioUrl;
                const patch: Prisma.CandidateUpdateInput = {};
                if (!candidate.phone && applicant.phone) patch.phone = applicant.phone;
                if (!candidate.location && applicant.location) patch.location = applicant.location;
                if (JSON.stringify(merged) !== JSON.stringify(links)) patch.socialLinks = merged;
                if (!candidate.referredBy && source.referredById) {
                    patch.referredBy = source.referredById;
                    patch.referredOn = new Date();
                }
                if (Object.keys(patch).length) await tx.candidate.update({ where: { id: candidate.id }, data: patch });
            }

            // One application per candidate per job: a repeat submission is a no-op.
            const existingApplication = await tx.application.findUnique({
                where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
                select: { id: true },
            });
            if (existingApplication) {
                return { status: "duplicate" as const, candidateId: candidate.id, applicationId: existingApplication.id, candidateCreated, resumeId: null };
            }

            const resume = stored && input.resume
                ? await tx.resume.create({
                      data: {
                          candidateId: candidate.id,
                          fileName: input.resume.originalname.slice(0, 200),
                          fileUrl: stored.key,
                          fileSize: input.resume.size,
                          mimeType: input.resume.mimetype,
                          storageProvider: ((process.env.STORAGE_PROVIDER || "local").toUpperCase() as "LOCAL" | "S3" | "R2"),
                          isActive: true,
                      },
                      select: { id: true },
                  })
                : null;

            const application = await tx.application.create({
                data: {
                    candidateId: candidate.id,
                    jobId,
                    currentStage: input.stage ?? "APPLIED",
                    sourceType: source.type,
                    sourceName: source.name ?? sourceLabel(source.type),
                    sourceExternalId: source.externalId ?? null,
                    sourceDetails: (source.details as Prisma.InputJsonValue) ?? undefined,
                    referredById: source.referredById ?? null,
                    coverLetter: input.coverLetter || null,
                    answers: input.answers?.length ? (input.answers as Prisma.InputJsonValue) : undefined,
                    linkedinUrl: applicant.linkedinUrl || null,
                    portfolioUrl: applicant.portfolioUrl || null,
                    consentAt: input.consent?.at ?? null,
                    consentVersion: input.consent?.version ?? null,
                    resumeId: resume?.id ?? null,
                },
                select: { id: true },
            });

            if (input.note) {
                await tx.note.create({
                    data: { candidateId: candidate.id, applicationId: application.id, authorId: input.note.authorId, content: input.note.content },
                });
            }

            return { status: "created" as const, candidateId: candidate.id, applicationId: application.id, candidateCreated, resumeId: resume?.id ?? null };
        });

        // A duplicate submission does not need the uploaded file.
        if (result.status === "duplicate" && stored) {
            StorageFactory.getService().deleteFile(stored.key).catch(() => undefined);
        }

        if (result.status === "created") {
            await afterApplicationCreated({
                organizationId,
                candidateId: result.candidateId,
                applicationId: result.applicationId,
                candidateCreated: result.candidateCreated,
                job,
                source,
                actorId: input.actorId ?? null,
                applicantName: `${applicant.firstName} ${applicant.lastName ?? ""}`.trim(),
                applicantEmail: applicant.email,
            });
        }

        return { status: result.status, candidateId: result.candidateId, applicationId: result.applicationId, candidateCreated: result.candidateCreated, jobTitle: job.title };
    } catch (error) {
        if (stored) StorageFactory.getService().deleteFile(stored.key).catch(() => undefined);
        // Two concurrent submissions for the same person and job: the loser
        // hits a unique constraint. Treat it as the duplicate it is.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const existing = await prisma.application.findFirst({
                where: { jobId, candidate: { organizationId, emailNormalized } },
                select: { id: true, candidateId: true },
            });
            if (existing) {
                return { status: "duplicate", candidateId: existing.candidateId, applicationId: existing.id, candidateCreated: false, jobTitle: job.title };
            }
        }
        throw error;
    }
}

/** Side effects after a new application: activity log, notifications, referral emails. Never throws. */
async function afterApplicationCreated(ctx: {
    organizationId: string;
    candidateId: string;
    applicationId: string;
    candidateCreated: boolean;
    job: { id: string; title: string; department: string };
    source: ApplicationSourceInput;
    actorId: string | null;
    applicantName: string;
    applicantEmail: string;
}) {
    try {
        const { logActivity } = await import("../timeline/timeline.service");
        await logActivity({
            type: ctx.candidateCreated ? "CANDIDATE_CREATED" : "APPLICATION_CREATED",
            actorId: ctx.actorId ?? undefined,
            entityType: "Candidate",
            entityId: ctx.candidateId,
            description: ctx.actorId
                ? `Added ${ctx.applicantName} for ${ctx.job.title}`
                : `${ctx.applicantName} applied for ${ctx.job.title} via ${ctx.source.name ?? sourceLabel(ctx.source.type)}`,
            department: ctx.job.department,
            metadata: {
                jobTitle: ctx.job.title,
                jobId: ctx.job.id,
                applicationId: ctx.applicationId,
                sourceType: ctx.source.type,
            },
        });

        const { notifyNewCandidate } = await import("../notifications/notification.service");
        notifyNewCandidate({
            candidateId: ctx.candidateId,
            candidateName: ctx.applicantName,
            jobId: ctx.job.id,
            jobTitle: ctx.job.title,
            jobDepartment: ctx.job.department,
            isReferral: !!ctx.source.referredById,
            referrerUserId: ctx.source.referredById ?? undefined,
        }).catch((e) => logger.error(`notifyNewCandidate failed: ${String(e)}`));

        if (ctx.source.referredById) {
            const referrer = await prisma.user.findUnique({ where: { id: ctx.source.referredById } });
            if (referrer) {
                const referrerName = `${referrer.firstName} ${referrer.lastName}`;
                const { emailService } = await import("../email/email.service");
                emailService
                    .sendCandidateReferralAddedEmail({ to: ctx.applicantEmail, candidateName: ctx.applicantName, referrerName, jobTitle: ctx.job.title })
                    .catch(() => undefined);
                emailService
                    .sendReferrerReferralAddedEmail({ to: referrer.email, candidateName: ctx.applicantName, referrerName, jobTitle: ctx.job.title })
                    .catch(() => undefined);
            }
        }
    } catch (error) {
        logger.error(`afterApplicationCreated failed for application ${ctx.applicationId}: ${String(error)}`);
    }
}
