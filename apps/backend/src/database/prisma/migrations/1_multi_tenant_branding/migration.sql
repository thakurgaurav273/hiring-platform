-- Multi-tenant branding & theming
--
-- Introduces organizations (tenants), per-organization branding and per-user
-- appearance preferences. Existing data is preserved: every existing user and
-- invitation is moved into a single default organization whose owner is the
-- earliest active administrator. The organization receives the default
-- Robin Labs "Modern Enterprise" theme.
--
-- Safe to run on an empty database (no default organization is created).

-- ─── Enums ──────────────────────────────────────────────────────────────────
CREATE TYPE "ThemePreset" AS ENUM ('modern_enterprise', 'corporate', 'minimal', 'warm_professional', 'midnight');
CREATE TYPE "AppearanceMode" AS ENUM ('light', 'dark', 'system');
CREATE TYPE "SidebarStyle" AS ENUM ('solid', 'subtle', 'transparent');
CREATE TYPE "FontPreset" AS ENUM ('default', 'modern', 'classic');
CREATE TYPE "RadiusPreset" AS ENUM ('compact', 'comfortable', 'rounded');

-- ─── Tables ─────────────────────────────────────────────────────────────────
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_branding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "displayName" TEXT,
    "logoKey" TEXT,
    "faviconKey" TEXT,
    "themePreset" "ThemePreset" NOT NULL DEFAULT 'modern_enterprise',
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "defaultAppearance" "AppearanceMode" NOT NULL DEFAULT 'system',
    "sidebarStyle" "SidebarStyle" NOT NULL DEFAULT 'solid',
    "fontPreset" "FontPreset" NOT NULL DEFAULT 'default',
    "radiusPreset" "RadiusPreset" NOT NULL DEFAULT 'comfortable',
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_branding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appearance" "AppearanceMode",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- Tenant columns start nullable so existing rows can be backfilled.
ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "user_invitations" ADD COLUMN "organizationId" TEXT;

-- ─── Backfill existing data into a default organization ────────────────────
DO $$
DECLARE
    default_org_id TEXT := gen_random_uuid()::text;
    owner_id TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM "users") OR EXISTS (SELECT 1 FROM "user_invitations") THEN
        SELECT "id" INTO owner_id
        FROM "users"
        ORDER BY ("role" = 'administrator' AND "isActive") DESC, "createdAt" ASC
        LIMIT 1;

        INSERT INTO "organizations" ("id", "name", "slug", "ownerId", "updatedAt")
        VALUES (default_org_id, 'Grovyn', 'grovyn', owner_id, CURRENT_TIMESTAMP);

        UPDATE "users" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
        UPDATE "user_invitations" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    END IF;
END $$;

-- Every organization gets the default Robin Labs theme.
INSERT INTO "organization_branding" ("id", "organizationId", "updatedAt")
SELECT gen_random_uuid()::text, o."id", CURRENT_TIMESTAMP
FROM "organizations" o
WHERE NOT EXISTS (SELECT 1 FROM "organization_branding" b WHERE b."organizationId" = o."id");

-- Every user gets a preferences row that follows the organization default.
INSERT INTO "user_preferences" ("id", "userId", "updatedAt")
SELECT gen_random_uuid()::text, u."id", CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "user_preferences" p WHERE p."userId" = u."id");

-- ─── Constraints ────────────────────────────────────────────────────────────
ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "user_invitations" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organizations_ownerId_key" ON "organizations"("ownerId");
CREATE UNIQUE INDEX "organization_branding_organizationId_key" ON "organization_branding"("organizationId");
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX "user_invitations_organizationId_idx" ON "user_invitations"("organizationId");

ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
