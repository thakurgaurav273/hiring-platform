import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import {
    AppearanceMode,
    OrganizationBranding,
    Prisma,
    Role,
} from "@prisma/client";
import prisma from "../../database/prisma-client";
import { AppError } from "../../common/errors/app-error";
import { Permission, hasPermission } from "../../common/constants/permissions";
import { StorageFactory } from "../../common/services/storage/storage.factory";
import { assertImageSignature } from "../../common/middlewares/image-upload.middleware";
import logger from "../../shared/logger/logger";
import organizationRepository from "./organization.repository";
import {
    BRANDING_ASSET_RULES,
    BrandingAssetKind,
    DEFAULT_BRANDING,
} from "./organization.constants";
import { UpdateBrandingInput } from "./organization.validation";

/** The authenticated actor, as set by auth.middleware. */
export interface Actor {
    id: string;
    role: Role;
    organizationId: string;
}

export interface BrandingDTO {
    organizationId: string;
    organizationName: string;
    /** Effective name to display: the override, or the organization name. */
    displayName: string;
    /** Raw override as stored (null = use organization name). */
    customDisplayName: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    themePreset: OrganizationBranding["themePreset"];
    primaryColor: string | null;
    secondaryColor: string | null;
    defaultAppearance: OrganizationBranding["defaultAppearance"];
    sidebarStyle: OrganizationBranding["sidebarStyle"];
    fontPreset: OrganizationBranding["fontPreset"];
    radiusPreset: OrganizationBranding["radiusPreset"];
    updatedAt: string;
}

export interface WorkspaceDTO {
    organization: { id: string; name: string; slug: string };
    branding: BrandingDTO;
    preferences: { appearance: AppearanceMode | null };
    permissions: { canManageBranding: boolean; isOwner: boolean };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const resolveAssetUrl = async (key: string | null): Promise<string | null> => {
    if (!key) return null;
    try {
        return await StorageFactory.getService().getFileUrl(key);
    } catch (error) {
        logger.error(`Failed to resolve branding asset URL for ${key}: ${String(error)}`);
        return null;
    }
};

export const toBrandingDTO = async (
    organization: { id: string; name: string },
    branding: OrganizationBranding
): Promise<BrandingDTO> => {
    const [logoUrl, faviconUrl] = await Promise.all([
        resolveAssetUrl(branding.logoKey),
        resolveAssetUrl(branding.faviconKey),
    ]);
    return {
        organizationId: organization.id,
        organizationName: organization.name,
        displayName: branding.displayName || organization.name,
        customDisplayName: branding.displayName,
        logoUrl,
        faviconUrl,
        themePreset: branding.themePreset,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        defaultAppearance: branding.defaultAppearance,
        sidebarStyle: branding.sidebarStyle,
        fontPreset: branding.fontPreset,
        radiusPreset: branding.radiusPreset,
        updatedAt: branding.updatedAt.toISOString(),
    };
};

const loadOrganization = async (organizationId: string) => {
    const organization = await organizationRepository.findOrganizationById(organizationId);
    if (!organization) {
        throw new AppError("Organization not found", StatusCodes.NOT_FOUND);
    }
    return organization;
};

/** Owners can always manage branding; otherwise the role needs MANAGE_BRANDING. */
export const canManageBranding = (actor: Actor, ownerId: string | null): boolean =>
    actor.id === ownerId || hasPermission(actor.role, Permission.MANAGE_BRANDING);

const assertCanManageBranding = async (actor: Actor) => {
    const organization = await loadOrganization(actor.organizationId);
    if (!canManageBranding(actor, organization.ownerId)) {
        throw new AppError(
            "You do not have permission to change this organization's branding",
            StatusCodes.FORBIDDEN
        );
    }
    return organization;
};

// ─── Branding ───────────────────────────────────────────────────────────────

export const getBranding = async (organizationId: string): Promise<BrandingDTO> => {
    const organization = await loadOrganization(organizationId);
    const branding =
        organization.branding ?? (await organizationRepository.findOrCreateBranding(organizationId));
    return toBrandingDTO(organization, branding);
};

export const updateBranding = async (
    actor: Actor,
    input: UpdateBrandingInput
): Promise<BrandingDTO> => {
    const organization = await assertCanManageBranding(actor);
    const branding = await organizationRepository.updateBranding(actor.organizationId, {
        ...input,
        updatedById: actor.id,
    });
    return toBrandingDTO(organization, branding);
};

export const uploadBrandingAsset = async (
    actor: Actor,
    kind: BrandingAssetKind,
    file: Express.Multer.File | undefined
): Promise<BrandingDTO> => {
    const organization = await assertCanManageBranding(actor);
    if (!file) {
        throw new AppError("No image file was provided", StatusCodes.BAD_REQUEST);
    }

    const rules = BRANDING_ASSET_RULES[kind];
    const detected = assertImageSignature(file);
    if (!rules.types.includes(detected)) {
        throw new AppError(
            `A ${kind} must be one of: ${rules.types.map((t) => t.toUpperCase()).join(", ")}`,
            StatusCodes.BAD_REQUEST
        );
    }
    if (file.size > rules.maxBytes) {
        throw new AppError(
            `A ${kind} must be ${Math.round(rules.maxBytes / 1024)} KB or smaller`,
            StatusCodes.BAD_REQUEST
        );
    }

    const storage = StorageFactory.getService();
    const current = await organizationRepository.findOrCreateBranding(actor.organizationId);
    const previousKey = kind === "logo" ? current.logoKey : current.faviconKey;

    // The storage path is derived from the authenticated tenant, and the file
    // name is generated server-side, so a client cannot target another tenant.
    const { key } = await storage.uploadFile(
        file.buffer,
        `${kind}.${detected}`,
        file.mimetype,
        `branding/${actor.organizationId}`
    );

    const branding = await organizationRepository.updateBranding(actor.organizationId, {
        [kind === "logo" ? "logoKey" : "faviconKey"]: key,
        updatedById: actor.id,
    });

    if (previousKey && previousKey !== key) {
        storage.deleteFile(previousKey).catch((err) =>
            logger.warn(`Could not delete replaced ${kind} ${previousKey}: ${String(err)}`)
        );
    }

    return toBrandingDTO(organization, branding);
};

export const removeBrandingAsset = async (
    actor: Actor,
    kind: BrandingAssetKind
): Promise<BrandingDTO> => {
    const organization = await assertCanManageBranding(actor);
    const current = await organizationRepository.findOrCreateBranding(actor.organizationId);
    const previousKey = kind === "logo" ? current.logoKey : current.faviconKey;

    const branding = await organizationRepository.updateBranding(actor.organizationId, {
        [kind === "logo" ? "logoKey" : "faviconKey"]: null,
        updatedById: actor.id,
    });

    if (previousKey) {
        StorageFactory.getService()
            .deleteFile(previousKey)
            .catch((err) => logger.warn(`Could not delete ${kind} ${previousKey}: ${String(err)}`));
    }

    return toBrandingDTO(organization, branding);
};

// ─── Careers page settings ──────────────────────────────────────────────────

export const getCareersSettings = async (organizationId: string) => {
    const org = await loadOrganization(organizationId);
    return { slug: org.slug, about: org.about };
};

export const updateCareersSettings = async (actor: Actor, data: { about: string | null }) => {
    await assertCanManageBranding(actor);
    const org = await prisma.organization.update({
        where: { id: actor.organizationId },
        data: { about: data.about },
        select: { slug: true, about: true },
    });
    return org;
};

// ─── Per-user preferences ───────────────────────────────────────────────────

export const getPreferences = async (userId: string) => {
    const pref = await organizationRepository.findUserPreference(userId);
    return { appearance: pref?.appearance ?? null };
};

export const updatePreferences = async (
    userId: string,
    data: { appearance: AppearanceMode | null }
) => {
    const pref = await organizationRepository.upsertUserPreference(userId, {
        appearance: data.appearance,
    });
    return { appearance: pref.appearance };
};

// ─── Workspace context (org + branding + prefs + permissions) ──────────────

export const getWorkspace = async (actor: Actor): Promise<WorkspaceDTO> => {
    const organization = await loadOrganization(actor.organizationId);
    const branding =
        organization.branding ?? (await organizationRepository.findOrCreateBranding(organization.id));
    const [brandingDTO, preferences] = await Promise.all([
        toBrandingDTO(organization, branding),
        getPreferences(actor.id),
    ]);
    return {
        organization: { id: organization.id, name: organization.name, slug: organization.slug },
        branding: brandingDTO,
        preferences,
        permissions: {
            canManageBranding: canManageBranding(actor, organization.ownerId),
            isOwner: organization.ownerId === actor.id,
        },
    };
};

// ─── Provisioning ───────────────────────────────────────────────────────────

export const slugify = (value: string): string =>
    value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "org";

const uniqueSlug = async (name: string, tx: Prisma.TransactionClient) => {
    const base = slugify(name);
    for (let i = 0; i < 50; i++) {
        const candidate = i === 0 ? base : `${base}-${i + 1}`;
        const taken = await tx.organization.count({ where: { slug: candidate } });
        if (!taken) return candidate;
    }
    throw new AppError("Could not allocate a unique organization slug", StatusCodes.CONFLICT);
};

export interface ProvisionOrganizationInput {
    name: string;
    owner: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    };
}

/**
 * Registers a new organization in a single transaction:
 *   1. creates the organization record
 *   2. initialises default (Robin Labs Warm Professional) branding
 *   3. creates the owner as an administrator
 *   4. initialises the owner's appearance preferences (follow org default)
 *
 * Branding is never required at registration; owners customise it later in Settings.
 */
export const provisionOrganization = async (input: ProvisionOrganizationInput) => {
    const name = input.name.trim();
    const email = input.owner.email.trim().toLowerCase();
    if (!name) throw new AppError("Organization name is required", StatusCodes.BAD_REQUEST);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AppError("User with this email already exists", StatusCodes.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(input.owner.password, 10);

    return prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
            data: {
                name,
                slug: await uniqueSlug(name, tx),
                branding: { create: { ...DEFAULT_BRANDING } },
            },
        });

        const owner = await tx.user.create({
            data: {
                organizationId: organization.id,
                email,
                password: hashedPassword,
                firstName: input.owner.firstName.trim(),
                lastName: input.owner.lastName.trim(),
                role: Role.administrator,
                preference: { create: {} },
            },
        });

        const updated = await tx.organization.update({
            where: { id: organization.id },
            data: { ownerId: owner.id },
            include: { branding: true },
        });

        return {
            organization: updated,
            owner: {
                id: owner.id,
                email: owner.email,
                firstName: owner.firstName,
                lastName: owner.lastName,
                role: owner.role,
                isActive: owner.isActive,
                organizationId: owner.organizationId,
            },
        };
    });
};
