/**
 * Job distribution: per-destination publishing state for jobs.
 *
 * First-party destinations (careers page, website embed) are published by
 * Robin Talent directly. External job boards have no provider yet, so their
 * state is reported as "not connected" with a tracked share link. Nothing
 * here pretends an external post succeeded.
 */
import { JobStatus, PublicationChannel, PublicationStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../database/prisma-client";
import { AppError } from "../../common/errors/app-error";
import { CHANNELS, channelDefinition } from "./distribution.constants";

export interface DistributionActor {
    id: string;
    organizationId: string;
}

const FIRST_PARTY: PublicationChannel[] = ["CAREERS_PAGE", "WEBSITE_EMBED"];

/** Careers publication state implied by a job's status. */
function statusForJob(status: JobStatus): PublicationStatus {
    if (status === "OPEN") return "PUBLISHED";
    if (status === "ON_HOLD") return "PAUSED";
    return "UNPUBLISHED";
}

/**
 * Keeps first-party destinations in step with the job's status. Called only
 * when a job is created or its status changes: open → published, on hold →
 * paused, draft/closed → unpublished. A destination paused or unpublished by
 * hand stays that way until the job's status next changes.
 */
export async function syncCareersPublication(jobId: string, actorId: string | null) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, organizationId: true, status: true } });
    if (!job) return;
    const target = statusForJob(job.status);
    const now = new Date();

    for (const channel of FIRST_PARTY) {
        const existing = await prisma.jobPublication.findUnique({ where: { jobId_channel: { jobId, channel } } });
        if (!existing) {
            // Only create rows when the job opens; drafts have no publication yet.
            if (target !== "PUBLISHED") continue;
            await prisma.jobPublication.create({
                data: {
                    organizationId: job.organizationId,
                    jobId,
                    channel,
                    status: "PUBLISHED",
                    publishedAt: now,
                    lastSyncedAt: now,
                    updatedById: actorId,
                },
            });
            continue;
        }
        if (existing.status === target) continue;
        await prisma.jobPublication.update({
            where: { id: existing.id },
            data: {
                status: target,
                publishedAt: target === "PUBLISHED" ? now : existing.publishedAt,
                pausedAt: target === "PAUSED" ? now : null,
                lastSyncedAt: now,
                lastError: null,
                updatedById: actorId,
            },
        });
    }
}

async function loadJob(jobId: string, organizationId: string) {
    const job = await prisma.job.findFirst({
        where: { id: jobId, organizationId },
        select: { id: true, title: true, status: true, organizationId: true, organization: { select: { slug: true } } },
    });
    if (!job) throw new AppError("Job not found", StatusCodes.NOT_FOUND);
    return job;
}

/** Per-destination publishing state for one job. */
export async function getDistribution(jobId: string, actor: DistributionActor) {
    const job = await loadJob(jobId, actor.organizationId);
    const rows = await prisma.jobPublication.findMany({ where: { jobId } });

    const destinations = CHANNELS.map((def) => {
        const row = rows.find((r) => r.channel === def.channel);
        return {
            channel: def.channel,
            label: def.label,
            kind: def.kind,
            directPublishing: def.directPublishing,
            connected: def.directPublishing,
            manualHint: def.manualHint ?? null,
            utmSource: def.utmSource ?? null,
            status: row?.status ?? (def.directPublishing ? "UNPUBLISHED" : null),
            publishedAt: row?.publishedAt ?? null,
            pausedAt: row?.pausedAt ?? null,
            lastSyncedAt: row?.lastSyncedAt ?? null,
            lastError: row?.lastError ?? null,
            externalUrl: row?.externalUrl ?? null,
        };
    });

    return {
        job: { id: job.id, title: job.title, status: job.status },
        organizationSlug: job.organization.slug,
        destinations,
    };
}

/**
 * Publish, pause or unpublish a first-party destination. External boards are
 * rejected with a clear message until a real provider exists.
 */
export async function setPublication(
    jobId: string,
    channel: PublicationChannel,
    action: "publish" | "pause" | "unpublish",
    actor: DistributionActor
) {
    const job = await loadJob(jobId, actor.organizationId);
    const def = channelDefinition(channel);

    if (!def.directPublishing) {
        throw new AppError(
            `${def.label} isn't connected. ${def.manualHint ?? ""}`.trim(),
            StatusCodes.CONFLICT
        );
    }
    if (action === "publish" && job.status !== "OPEN") {
        throw new AppError("Open the job before publishing it. Draft, on-hold and closed jobs can't take applications.", StatusCodes.CONFLICT);
    }

    const now = new Date();
    const status: PublicationStatus = action === "publish" ? "PUBLISHED" : action === "pause" ? "PAUSED" : "UNPUBLISHED";

    const publication = await prisma.jobPublication.upsert({
        where: { jobId_channel: { jobId, channel } },
        create: {
            organizationId: actor.organizationId,
            jobId,
            channel,
            status,
            publishedAt: status === "PUBLISHED" ? now : null,
            pausedAt: status === "PAUSED" ? now : null,
            lastSyncedAt: now,
            updatedById: actor.id,
        },
        update: {
            status,
            publishedAt: status === "PUBLISHED" ? now : undefined,
            pausedAt: status === "PAUSED" ? now : null,
            lastSyncedAt: now,
            lastError: null,
            updatedById: actor.id,
        },
    });

    const { logActivity } = await import("../timeline/timeline.service");
    await logActivity({
        type: "JOB_PUBLICATION_CHANGED",
        actorId: actor.id,
        entityType: "Job",
        entityId: jobId,
        description: `${action === "publish" ? "Published" : action === "pause" ? "Paused" : "Unpublished"} "${job.title}" on ${def.label}`,
        metadata: { channel, status },
    });

    return publication;
}
