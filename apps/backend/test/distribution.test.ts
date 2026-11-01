import request from "supertest";
import app from "../src/app";
import prisma from "../src/database/prisma-client";
import { createOrg, resetDatabase } from "./helpers";

const API = "/api/v1";
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

jest.mock("../src/modules/email/email.service", () => ({
    emailService: new Proxy({}, { get: () => jest.fn().mockResolvedValue(undefined) }),
}));

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

const inAMonth = () => new Date(Date.now() + 30 * 86_400_000).toISOString();

async function createJob(token: string, patch: Record<string, unknown> = {}) {
    const res = await request(app)
        .post(`${API}/jobs`)
        .set(auth(token))
        .send({
            title: "Senior Frontend Developer",
            department: "Engineering",
            location: "Bengaluru",
            employmentType: "FULL_TIME",
            applicationDeadline: inAMonth(),
            description: "Build delightful hiring experiences with React and TypeScript.",
            status: "OPEN",
            salaryMin: 3000000,
            ...patch,
        });
    expect(res.status).toBe(201);
    return res.body.data as { id: string; organizationId: string; status: string };
}

const apply = (slug: string, jobId: string, fields: Record<string, string>, resume?: Buffer) => {
    let req = request(app).post(`${API}/public/careers/${slug}/jobs/${jobId}/apply`);
    for (const [k, v] of Object.entries({ fullName: "Ada Lovelace", email: "ada@example.com", consent: "true", ...fields })) {
        req = req.field(k, v);
    }
    if (resume) req = req.attach("resume", resume, { filename: "cv.pdf", contentType: "application/pdf" });
    return req;
};

beforeEach(resetDatabase);
afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
});

describe("tenant isolation of jobs and candidates", () => {
    it("never shows one organization's jobs or candidates to another", async () => {
        const a = await createOrg("Alpha Co");
        const b = await createOrg("Beta Co");
        const jobA = await createJob(a.ownerToken);
        const jobB = await createJob(b.ownerToken, { title: "Beta Role" });
        expect(jobA.organizationId).toBe(a.organization.id);

        await apply(a.organization.slug, jobA.id, {}).expect(201);

        const jobsForB = await request(app).get(`${API}/jobs`).set(auth(b.ownerToken)).expect(200);
        expect(jobsForB.body.data.jobs.map((j: { id: string }) => j.id)).toEqual([jobB.id]);

        await request(app).get(`${API}/jobs/${jobA.id}`).set(auth(b.ownerToken)).expect(404);
        await request(app).patch(`${API}/jobs/${jobA.id}`).set(auth(b.ownerToken)).send({ title: "Hacked" }).expect(404);
        await request(app).delete(`${API}/jobs/${jobA.id}`).set(auth(b.ownerToken)).expect(404);

        const candidatesForB = await request(app).get(`${API}/candidates`).set(auth(b.ownerToken)).expect(200);
        expect(candidatesForB.body.data.candidates).toHaveLength(0);

        const candidate = await prisma.candidate.findFirstOrThrow({ where: { organizationId: a.organization.id } });
        await request(app).get(`${API}/candidates/${candidate.id}`).set(auth(b.ownerToken)).expect(404);
        await request(app).get(`${API}/candidates/${candidate.id}/notes`).set(auth(b.ownerToken)).expect(404);

        const forA = await request(app).get(`${API}/candidates`).set(auth(a.ownerToken)).expect(200);
        expect(forA.body.data.candidates).toHaveLength(1);
    });

    it("never assigns a hiring manager from another organization to a job", async () => {
        const a = await createOrg("Gamma Co");
        const b = await createOrg("Delta Co", ["hiring_manager"]);
        const job = await createJob(a.ownerToken, { hiringManagerId: b.members[0].id });
        const stored = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
        expect(stored.hiringManagerId).toBeNull();
    });
});

describe("publishing lifecycle", () => {
    it("publishes open jobs to the careers page and embed automatically", async () => {
        const a = await createOrg("Publish Co");
        const job = await createJob(a.ownerToken);
        const rows = await prisma.jobPublication.findMany({ where: { jobId: job.id }, orderBy: { channel: "asc" } });
        expect(rows.map((r) => [r.channel, r.status])).toEqual([
            ["CAREERS_PAGE", "PUBLISHED"],
            ["WEBSITE_EMBED", "PUBLISHED"],
        ]);
    });

    it("tracks each destination independently and never fakes external publishing", async () => {
        const a = await createOrg("Channels Co");
        const job = await createJob(a.ownerToken);

        const dist = await request(app).get(`${API}/distribution/jobs/${job.id}`).set(auth(a.ownerToken)).expect(200);
        const byChannel = Object.fromEntries(dist.body.data.destinations.map((d: { channel: string }) => [d.channel, d]));
        expect(byChannel.CAREERS_PAGE).toMatchObject({ status: "PUBLISHED", connected: true });
        expect(byChannel.LINKEDIN).toMatchObject({ status: null, connected: false, directPublishing: false });

        const linkedin = await request(app)
            .put(`${API}/distribution/jobs/${job.id}/LINKEDIN`)
            .set(auth(a.ownerToken))
            .send({ action: "publish" })
            .expect(409);
        expect(linkedin.body.message).toMatch(/isn't connected/);
        expect(await prisma.jobPublication.count({ where: { jobId: job.id, channel: "LINKEDIN" } })).toBe(0);

        // Pausing the embed leaves the careers page published.
        await request(app).put(`${API}/distribution/jobs/${job.id}/WEBSITE_EMBED`).set(auth(a.ownerToken)).send({ action: "pause" }).expect(200);
        const careers = await request(app).get(`${API}/public/careers/${a.organization.slug}`).expect(200);
        const embed = await request(app).get(`${API}/public/careers/${a.organization.slug}?channel=embed`).expect(200);
        expect(careers.body.data.jobs).toHaveLength(1);
        expect(embed.body.data.jobs).toHaveLength(0);
    });

    it("follows the job status: on hold pauses, closed unpublishes, drafts can't be published", async () => {
        const a = await createOrg("Status Co");
        const job = await createJob(a.ownerToken);

        await request(app).patch(`${API}/jobs/${job.id}`).set(auth(a.ownerToken)).send({ status: "ON_HOLD" }).expect(200);
        expect((await prisma.jobPublication.findFirstOrThrow({ where: { jobId: job.id, channel: "CAREERS_PAGE" } })).status).toBe("PAUSED");

        await request(app).patch(`${API}/jobs/${job.id}`).set(auth(a.ownerToken)).send({ status: "CLOSED" }).expect(200);
        expect((await prisma.jobPublication.findFirstOrThrow({ where: { jobId: job.id, channel: "CAREERS_PAGE" } })).status).toBe("UNPUBLISHED");

        const draft = await createJob(a.ownerToken, { status: "DRAFT", title: "Draft Role" });
        await request(app).put(`${API}/distribution/jobs/${draft.id}/CAREERS_PAGE`).set(auth(a.ownerToken)).send({ action: "publish" }).expect(409);
        await request(app).get(`${API}/public/careers/${a.organization.slug}/jobs/${draft.id}`).expect(404);
    });
});

describe("public careers page", () => {
    it("lists only published jobs, with public fields only", async () => {
        const a = await createOrg("Careers Co");
        const open = await createJob(a.ownerToken);
        await createJob(a.ownerToken, { status: "DRAFT", title: "Hidden Draft" });

        const res = await request(app).get(`${API}/public/careers/${a.organization.slug}`).expect(200);
        expect(res.body.data.organization).toMatchObject({ slug: a.organization.slug, name: "Careers Co" });
        expect(res.body.data.jobs.map((j: { id: string }) => j.id)).toEqual([open.id]);
        expect(res.body.data.filters.departments).toEqual(["Engineering"]);

        const detail = await request(app).get(`${API}/public/careers/${a.organization.slug}/jobs/${open.id}`).expect(200);
        const job = detail.body.data.job;
        expect(job.description).toMatch(/React/);
        for (const secret of ["salaryMin", "salaryMax", "recruiterId", "hiringManagerId", "organizationId", "applications"]) {
            expect(job).not.toHaveProperty(secret);
        }
    });

    it("does not serve one organization's job under another's slug", async () => {
        const a = await createOrg("Slug A");
        const b = await createOrg("Slug B");
        const job = await createJob(a.ownerToken);
        await request(app).get(`${API}/public/careers/${b.organization.slug}/jobs/${job.id}`).expect(404);
        await apply(b.organization.slug, job.id, {}).expect(404);
        await request(app).get(`${API}/public/careers/no-such-org`).expect(404);
    });
});

describe("public applications", () => {
    it("creates the candidate and application in the right organization with source attribution and résumé", async () => {
        const a = await createOrg("Apply Co");
        const job = await createJob(a.ownerToken);

        await apply(
            a.organization.slug,
            job.id,
            {
                fullName: "Grace Brewster Hopper",
                email: "Grace@Example.com",
                phone: "+91 98765 43210",
                linkedinUrl: "https://www.linkedin.com/in/grace",
                coverLetter: "I'd love to join.",
                utm_campaign: "autumn",
            },
            PDF
        ).expect(201);

        const app1 = await prisma.application.findFirstOrThrow({ where: { jobId: job.id }, include: { candidate: true, resume: true } });
        expect(app1.candidate).toMatchObject({
            organizationId: a.organization.id,
            firstName: "Grace",
            lastName: "Brewster Hopper",
            emailNormalized: "grace@example.com",
        });
        expect(app1).toMatchObject({
            sourceType: "CAREERS_PAGE",
            sourceName: "Robin Talent Careers",
            coverLetter: "I'd love to join.",
            linkedinUrl: "https://www.linkedin.com/in/grace",
            currentStage: "APPLIED",
        });
        expect(app1.consentAt).toBeInstanceOf(Date);
        expect(app1.sourceDetails).toMatchObject({ channel: "careers", utm_campaign: "autumn" });
        expect(app1.resume).toMatchObject({ candidateId: app1.candidateId, mimeType: "application/pdf" });
        expect(app1.resume!.fileUrl).toMatch(new RegExp(`^resumes/${a.organization.id}/`));
    });

    it("deduplicates by normalized email and keeps one application per job", async () => {
        const a = await createOrg("Dedup Co");
        const job1 = await createJob(a.ownerToken);
        const job2 = await createJob(a.ownerToken, { title: "Second Role" });

        await apply(a.organization.slug, job1.id, { email: "ada@example.com" }).expect(201);
        // Same person, different casing and spacing, same job: no new records, same response.
        await apply(a.organization.slug, job1.id, { email: "  ADA@example.com " }).expect(201);
        // Same person, another job: new application on the existing candidate.
        await apply(a.organization.slug, job2.id, { email: "ada@EXAMPLE.com", utm_source: "linkedin" }).expect(201);

        const candidates = await prisma.candidate.findMany({ where: { organizationId: a.organization.id } });
        expect(candidates).toHaveLength(1);
        const apps = await prisma.application.findMany({ where: { candidateId: candidates[0].id }, orderBy: { createdAt: "asc" } });
        expect(apps.map((x) => [x.jobId, x.sourceType])).toEqual([
            [job1.id, "CAREERS_PAGE"],
            [job2.id, "LINKEDIN"],
        ]);
    });

    it("keeps the same email in two organizations as two separate candidates", async () => {
        const a = await createOrg("Org One");
        const b = await createOrg("Org Two");
        const ja = await createJob(a.ownerToken);
        const jb = await createJob(b.ownerToken);
        await apply(a.organization.slug, ja.id, {}).expect(201);
        await apply(b.organization.slug, jb.id, {}).expect(201);
        const rows = await prisma.candidate.findMany({ where: { emailNormalized: "ada@example.com" } });
        expect(new Set(rows.map((r) => r.organizationId))).toEqual(new Set([a.organization.id, b.organization.id]));
    });

    it("attributes embed applications to the company website", async () => {
        const a = await createOrg("Embed Co");
        const job = await createJob(a.ownerToken);
        await apply(a.organization.slug, job.id, { channel: "embed", referrerUrl: "https://embed-co.example/careers" }).expect(201);
        const row = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });
        expect(row.sourceType).toBe("COMPANY_WEBSITE");
        expect(row.sourceDetails).toMatchObject({ channel: "embed", referrerHost: "embed-co.example" });
    });

    it("validates the form, consent, custom questions and résumé content", async () => {
        const a = await createOrg("Validate Co");
        const job = await createJob(a.ownerToken, {
            applicationQuestions: [
                { id: "notice", label: "Notice period", type: "single_choice", options: ["Immediate", "30 days"], required: true },
                { id: "relocate", label: "Willing to relocate?", type: "yes_no", required: false },
            ],
        });
        const slug = a.organization.slug;

        await apply(slug, job.id, { consent: "false" }).expect(400);
        await apply(slug, job.id, { email: "not-an-email", answers: JSON.stringify({ notice: "Immediate" }) }).expect(400);
        const missing = await apply(slug, job.id, {}).expect(400);
        expect(missing.body.message).toMatch(/Notice period/);
        await apply(slug, job.id, { answers: JSON.stringify({ notice: "Next year" }) }).expect(400);

        const fake = Buffer.from("<html><script>alert(1)</script></html>");
        await apply(slug, job.id, { answers: JSON.stringify({ notice: "Immediate" }) }, fake).expect(400);

        await apply(slug, job.id, { answers: JSON.stringify({ notice: "30 days", relocate: "yes", extra: "ignored" }) }, PDF).expect(201);
        const row = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });
        expect(row.answers).toEqual([
            { id: "notice", label: "Notice period", answer: "30 days" },
            { id: "relocate", label: "Willing to relocate?", answer: "Yes" },
        ]);
    });

    it("silently drops honeypot submissions", async () => {
        const a = await createOrg("Bot Co");
        const job = await createJob(a.ownerToken);
        await apply(a.organization.slug, job.id, { website: "spam" }).expect(201);
        expect(await prisma.application.count({ where: { jobId: job.id } })).toBe(0);
    });

    it("rejects applications to paused, closed or past-deadline jobs", async () => {
        const a = await createOrg("Closed Co");
        const job = await createJob(a.ownerToken);
        await request(app).put(`${API}/distribution/jobs/${job.id}/CAREERS_PAGE`).set(auth(a.ownerToken)).send({ action: "pause" }).expect(200);
        await apply(a.organization.slug, job.id, {}).expect(404);

        const expired = await createJob(a.ownerToken, { title: "Expired" });
        await prisma.job.update({ where: { id: expired.id }, data: { applicationDeadline: new Date(Date.now() - 86_400_000) } });
        await apply(a.organization.slug, expired.id, {}).expect(404);
    });
});

describe("manual entry and referrals use the same ingestion", () => {
    it("records MANUAL and EMPLOYEE_REFERRAL sources and rejects duplicates", async () => {
        const a = await createOrg("Manual Co", ["employee"]);
        const job = await createJob(a.ownerToken);

        await request(app)
            .post(`${API}/candidates`)
            .set(auth(a.ownerToken))
            .send({ firstName: "Manual", lastName: "Entry", email: "manual@example.com", jobId: job.id })
            .expect(201);
        await request(app)
            .post(`${API}/candidates`)
            .set(auth(a.ownerToken))
            .send({ firstName: "Manual", lastName: "Entry", email: "MANUAL@example.com", jobId: job.id })
            .expect(409);

        const employee = a.members[0];
        await request(app)
            .post(`${API}/candidates`)
            .set(auth(employee.token))
            .send({ firstName: "Friend", lastName: "One", email: "friend@example.com", jobId: job.id, referredBy: employee.id, whySuggest: "Great engineer" })
            .expect(201);
        // Employees can't attribute referrals to someone else.
        await request(app)
            .post(`${API}/candidates`)
            .set(auth(employee.token))
            .send({ firstName: "Friend", lastName: "Two", email: "friend2@example.com", jobId: job.id, referredBy: a.owner.id })
            .expect(403);

        const rows = await prisma.application.findMany({ where: { jobId: job.id }, include: { candidate: true, notes: true } });
        const manual = rows.find((r) => r.candidate.emailNormalized === "manual@example.com")!;
        const referral = rows.find((r) => r.candidate.emailNormalized === "friend@example.com")!;
        expect(manual.sourceType).toBe("MANUAL");
        expect(referral).toMatchObject({ sourceType: "EMPLOYEE_REFERRAL", referredById: employee.id });
        expect(referral.notes.map((n) => n.content)).toEqual(["Great engineer"]);
    });

    it("never changes the source when the candidate moves through the pipeline", async () => {
        const a = await createOrg("Pipeline Co");
        const job = await createJob(a.ownerToken);
        await apply(a.organization.slug, job.id, { utm_source: "indeed" }).expect(201);
        const candidate = await prisma.candidate.findFirstOrThrow({ where: { organizationId: a.organization.id } });

        await request(app).patch(`${API}/candidates/${candidate.id}/stage`).set(auth(a.ownerToken)).send({ stage: "SCREENING" }).expect(200);
        const row = await prisma.application.findFirstOrThrow({ where: { candidateId: candidate.id } });
        expect(row).toMatchObject({ currentStage: "SCREENING", sourceType: "INDEED", sourceName: "Indeed" });
    });
});

describe("reports", () => {
    it("reports applications by source with conversion, scoped to the organization", async () => {
        const a = await createOrg("Reports Co");
        const b = await createOrg("Other Reports Co");
        const job = await createJob(a.ownerToken);
        const other = await createJob(b.ownerToken);
        await apply(a.organization.slug, job.id, { email: "one@example.com" }).expect(201);
        await apply(a.organization.slug, job.id, { email: "two@example.com", utm_source: "linkedin" }).expect(201);
        await apply(a.organization.slug, job.id, { email: "three@example.com", utm_source: "linkedin" }).expect(201);
        await apply(b.organization.slug, other.id, { email: "x@example.com" }).expect(201);

        const hired = await prisma.candidate.findFirstOrThrow({ where: { organizationId: a.organization.id, emailNormalized: "two@example.com" } });
        await prisma.application.updateMany({ where: { candidateId: hired.id }, data: { currentStage: "HIRED" } });

        const res = await request(app).get(`${API}/reports`).set(auth(a.ownerToken)).expect(200);
        expect(res.body.data.kpis.totalApplications).toBe(3);
        expect(res.body.data.applicationsBySource).toEqual([
            { sourceType: "LINKEDIN", label: "LinkedIn", applications: 2, interviewed: 1, hired: 1, interviewRate: 50, hireRate: 50 },
            { sourceType: "CAREERS_PAGE", label: "Robin Talent Careers", applications: 1, interviewed: 0, hired: 0, interviewRate: 0, hireRate: 0 },
        ]);
    });
});
