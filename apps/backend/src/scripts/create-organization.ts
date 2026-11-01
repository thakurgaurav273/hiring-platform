/**
 * Provision a new organization (tenant) and its owner account.
 *
 *   npm run org:create -- --name "Acme Inc" --email owner@acme.com \
 *     --first-name Ada --last-name Lovelace
 *
 * The owner password is read from the ORG_OWNER_PASSWORD environment variable
 * so it does not end up in shell history. If it is not set, a random password
 * is generated and printed once.
 *
 * The organization starts with the default Robin Labs "Warm Professional"
 * theme. The owner can customise it in Settings → Branding & Appearance.
 */
import crypto from "crypto";
import prisma from "../database/prisma-client";
import { provisionOrganization } from "../modules/organization/organization.service";

function arg(name: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
    const name = arg("name");
    const email = arg("email");
    const firstName = arg("first-name") ?? "Owner";
    const lastName = arg("last-name") ?? "";

    if (!name || !email) {
        console.error(
            'Usage: npm run org:create -- --name "Acme Inc" --email owner@acme.com [--first-name Ada] [--last-name Lovelace]'
        );
        process.exit(1);
    }

    const generated = !process.env.ORG_OWNER_PASSWORD;
    const password = process.env.ORG_OWNER_PASSWORD ?? crypto.randomBytes(12).toString("base64url");
    if (password.length < 8) {
        console.error("ORG_OWNER_PASSWORD must be at least 8 characters");
        process.exit(1);
    }

    const { organization, owner } = await provisionOrganization({
        name,
        owner: { email, password, firstName, lastName },
    });

    console.log(`Created organization "${organization.name}" (slug: ${organization.slug}, id: ${organization.id})`);
    console.log(`Owner: ${owner.email} (administrator)`);
    console.log(`Theme: ${organization.branding?.themePreset}`);
    if (generated) console.log(`Generated owner password (shown once): ${password}`);
}

main()
    .catch((err) => {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
