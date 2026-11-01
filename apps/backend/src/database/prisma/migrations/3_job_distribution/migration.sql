-- Job distribution & application aggregation, phase 1
--
-- 1. Jobs and candidates become organization-scoped (backfilled from
--    existing relationships).
-- 2. Candidates are unique per organization on a normalized email instead of
--    globally on the raw email.
-- 3. Every application records where it came from (source attribution) and
--    what the applicant submitted.
-- 4. Publishing state is tracked per job and destination.

-- ─── Enums ──────────────────────────────────────────────────────────────────
CREATE TYPE "ApplicationSourceType" AS ENUM ('CAREERS_PAGE', 'COMPANY_WEBSITE', 'LINKEDIN', 'INDEED', 'NAUKRI', 'EMPLOYEE_REFERRAL', 'EMAIL', 'EXTERNAL_API', 'MANUAL', 'OTHER');
CREATE TYPE "PublicationChannel" AS ENUM ('CAREERS_PAGE', 'WEBSITE_EMBED', 'LINKEDIN', 'INDEED', 'NAUKRI');
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'PAUSED', 'FAILED', 'UNPUBLISHED');

-- ─── Organizations ──────────────────────────────────────────────────────────
ALTER TABLE "organizations" ADD COLUMN "about" TEXT;

-- ─── Jobs: organization ownership (from the recruiter's organization) ──────
ALTER TABLE "jobs" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "jobs" ADD COLUMN "applicationQuestions" JSONB;
UPDATE "jobs" j SET "organizationId" = u."organizationId" FROM "users" u WHERE u."id" = j."recruiterId";
ALTER TABLE "jobs" ALTER COLUMN "organizationId" SET NOT NULL;

-- ─── Candidates: organization ownership + normalized email ─────────────────
ALTER TABLE "candidates" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "candidates" ADD COLUMN "emailNormalized" TEXT;

-- Organization of the candidate's earliest application, then of the referrer.
UPDATE "candidates" c SET "organizationId" = (
    SELECT j."organizationId" FROM "applications" a JOIN "jobs" j ON j."id" = a."jobId"
    WHERE a."candidateId" = c."id" ORDER BY a."createdAt" ASC LIMIT 1
);
UPDATE "candidates" c SET "organizationId" = u."organizationId"
FROM "users" u WHERE c."organizationId" IS NULL AND u."id" = c."referredBy";

DO $$
DECLARE
    orphans INTEGER;
    clashes INTEGER;
BEGIN
    SELECT count(*) INTO orphans FROM "candidates" WHERE "organizationId" IS NULL;
    IF orphans > 0 THEN
        -- A candidate with no application and no referrer cannot be placed in
        -- an organization safely. Fail instead of guessing.
        RAISE EXCEPTION 'Migration 3_job_distribution: % candidate(s) have no application or referrer to derive an organization from. Assign them manually and re-run.', orphans;
    END IF;

    UPDATE "candidates" SET "emailNormalized" = lower(trim("email"));

    SELECT count(*) INTO clashes FROM (
        SELECT 1 FROM "candidates" GROUP BY "organizationId", "emailNormalized" HAVING count(*) > 1
    ) d;
    IF clashes > 0 THEN
        -- Two existing profiles differ only by email case/whitespace. Merging
        -- automatically could join different people, so stop here.
        RAISE EXCEPTION 'Migration 3_job_distribution: % email(s) match more than one candidate in the same organization after normalization. Merge or correct them manually and re-run.', clashes;
    END IF;
END $$;

ALTER TABLE "candidates" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "candidates" ALTER COLUMN "emailNormalized" SET NOT NULL;
DROP INDEX "candidates_email_key";

-- ─── Applications: source attribution and submitted data ───────────────────
ALTER TABLE "applications"
    ADD COLUMN "sourceType" "ApplicationSourceType" NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN "sourceName" TEXT,
    ADD COLUMN "sourceExternalId" TEXT,
    ADD COLUMN "sourceDetails" JSONB,
    ADD COLUMN "referredById" TEXT,
    ADD COLUMN "coverLetter" TEXT,
    ADD COLUMN "answers" JSONB,
    ADD COLUMN "linkedinUrl" TEXT,
    ADD COLUMN "portfolioUrl" TEXT,
    ADD COLUMN "consentAt" TIMESTAMP(3),
    ADD COLUMN "consentVersion" TEXT,
    ADD COLUMN "resumeId" TEXT;

-- Existing referrals: the referrer is stored as a user id on the candidate.
UPDATE "applications" a
SET "sourceType" = 'EMPLOYEE_REFERRAL', "sourceName" = 'Employee referral', "referredById" = u."id"
FROM "candidates" c JOIN "users" u ON u."id" = c."referredBy"
WHERE c."id" = a."candidateId";

-- ─── Publications ───────────────────────────────────────────────────────────
CREATE TABLE "job_publications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "channel" "PublicationChannel" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalUrl" TEXT,
    "lastError" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "job_publications_pkey" PRIMARY KEY ("id")
);

-- ─── Indexes and keys ───────────────────────────────────────────────────────
CREATE INDEX "job_publications_organizationId_channel_status_idx" ON "job_publications"("organizationId", "channel", "status");
CREATE UNIQUE INDEX "job_publications_jobId_channel_key" ON "job_publications"("jobId", "channel");
CREATE INDEX "jobs_organizationId_status_idx" ON "jobs"("organizationId", "status");
CREATE INDEX "candidates_organizationId_idx" ON "candidates"("organizationId");
CREATE UNIQUE INDEX "candidates_organizationId_emailNormalized_key" ON "candidates"("organizationId", "emailNormalized");
CREATE INDEX "applications_sourceType_idx" ON "applications"("sourceType");
CREATE UNIQUE INDEX "applications_jobId_sourceType_sourceExternalId_key" ON "applications"("jobId", "sourceType", "sourceExternalId");

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_publications" ADD CONSTRAINT "job_publications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_publications" ADD CONSTRAINT "job_publications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_publications" ADD CONSTRAINT "job_publications_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Jobs that are already open stay visible on the new careers page.
INSERT INTO "job_publications" ("id", "organizationId", "jobId", "channel", "status", "publishedAt", "lastSyncedAt", "updatedAt")
SELECT gen_random_uuid()::text, j."organizationId", j."id", 'CAREERS_PAGE', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "jobs" j WHERE j."status" = 'OPEN';
