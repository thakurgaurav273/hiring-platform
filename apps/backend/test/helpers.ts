import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import prisma from "../src/database/prisma-client";
import { provisionOrganization } from "../src/modules/organization/organization.service";

let counter = 0;

/** Deletes everything the branding tests create, in dependency order. */
export async function resetDatabase() {
    await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.dailyActivityCount.deleteMany(),
        prisma.jobPublication.deleteMany(),
        prisma.note.deleteMany(),
        prisma.application.deleteMany(),
        prisma.resume.deleteMany(),
        prisma.candidate.deleteMany(),
        prisma.jobInvitation.deleteMany(),
        prisma.job.deleteMany(),
        prisma.userPreference.deleteMany(),
        prisma.userInvitation.deleteMany(),
        prisma.refreshToken.deleteMany(),
        prisma.activityLog.deleteMany(),
        prisma.organizationBranding.deleteMany(),
        prisma.organization.updateMany({ data: { ownerId: null } }),
        prisma.user.deleteMany(),
        prisma.organization.deleteMany(),
    ]);
}

export function tokenFor(user: { id: string; email: string; role: Role }) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, {
        expiresIn: "15m",
    });
}

export const OWNER_PASSWORD = "Owner-pass-123";

/** Provisions an organization with an owner, plus optional extra members. */
export async function createOrg(name: string, members: Role[] = []) {
    counter += 1;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { organization, owner } = await provisionOrganization({
        name,
        owner: {
            email: `owner-${slug}-${counter}@example.com`,
            password: OWNER_PASSWORD,
            firstName: "Owner",
            lastName: name,
        },
    });

    const extra = [];
    for (const role of members) {
        counter += 1;
        extra.push(
            await prisma.user.create({
                data: {
                    organizationId: organization.id,
                    email: `${role}-${slug}-${counter}@example.com`,
                    password: "not-used",
                    firstName: role,
                    lastName: name,
                    role,
                    preference: { create: {} },
                },
            })
        );
    }

    return {
        organization,
        owner,
        ownerToken: tokenFor(owner),
        members: extra.map((u) => ({ ...u, token: tokenFor(u) })),
    };
}

/** Smallest valid PNG (1×1). */
export const PNG_1X1 = Buffer.from(
    "89504E470D0A1A0A0000000D4948445200000001000000010806000000" +
        "1F15C4890000000D49444154789C6360000002000154A24F5D0000000049454E44AE426082",
    "hex"
);
