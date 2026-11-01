import { Prisma } from "@prisma/client";
import prisma from "../../database/prisma-client";

// Every function here takes the organizationId explicitly. Callers must pass
// the authenticated user's organizationId (req.user.organizationId), never a
// value supplied by the client.

const findOrganizationById = async (organizationId: string) => {
    return prisma.organization.findUnique({
        where: { id: organizationId },
        include: { branding: true },
    });
};

/** Returns the organization's branding, creating the default row if it is missing. */
const findOrCreateBranding = async (organizationId: string) => {
    return prisma.organizationBranding.upsert({
        where: { organizationId },
        update: {},
        create: { organizationId },
    });
};

const updateBranding = async (
    organizationId: string,
    data: Prisma.OrganizationBrandingUncheckedUpdateInput
) => {
    return prisma.organizationBranding.upsert({
        where: { organizationId },
        update: data,
        create: { ...(data as Prisma.OrganizationBrandingUncheckedCreateInput), organizationId },
    });
};

const findUserPreference = async (userId: string) => {
    return prisma.userPreference.findUnique({ where: { userId } });
};

const upsertUserPreference = async (
    userId: string,
    data: Pick<Prisma.UserPreferenceUncheckedCreateInput, "appearance">
) => {
    return prisma.userPreference.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
    });
};

const organizationRepository = {
    findOrganizationById,
    findOrCreateBranding,
    updateBranding,
    findUserPreference,
    upsertUserPreference,
};

export default organizationRepository;
