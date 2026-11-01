-- Make "Warm Professional" (Robin Labs terracotta) the default theme preset.

-- New organizations
ALTER TABLE "organization_branding" ALTER COLUMN "themePreset" SET DEFAULT 'warm_professional';

-- Organizations that never customised their branding are still on the old
-- default, so they follow the new one. Any organization an admin has saved
-- branding for (updatedById is set) keeps its choice.
UPDATE "organization_branding"
SET "themePreset" = 'warm_professional', "updatedAt" = CURRENT_TIMESTAMP
WHERE "themePreset" = 'modern_enterprise'
  AND "updatedById" IS NULL
  AND "primaryColor" IS NULL
  AND "secondaryColor" IS NULL;
