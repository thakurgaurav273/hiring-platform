import { NotificationCategory } from "@prisma/client";
import prisma from "../../database/prisma-client";
import notificationRepository, { CreateNotificationInput } from "./notification.repository";
import { sendFcmMulticast } from "../../config/firebase-admin.config";

interface NotificationPayload {
    title: string;
    body: string;
    category: NotificationCategory;
    link?: string;
    entityId?: string;
    entityType?: string;
}

/**
 * Core delivery: persist to DB and push via FCM.
 * Never throws — failures are caught and logged.
 */
async function deliverNotifications(
    userIds: string[],
    payload: NotificationPayload
): Promise<void> {
    if (!userIds.length) return;

    try {
        // Deduplicate
        const uniqueIds = [...new Set(userIds)];

        // 1. Persist to DB
        const records: CreateNotificationInput[] = uniqueIds.map((userId) => ({
            userId,
            title: payload.title,
            body: payload.body,
            category: payload.category,
            link: payload.link,
            entityId: payload.entityId,
            entityType: payload.entityType,
        }));
        await notificationRepository.createMany(records);

        // 2. Push via FCM (fire-and-forget)
        const tokens = await notificationRepository.getFcmTokensForUsers(uniqueIds);
        sendFcmMulticast(tokens, payload.title, payload.body, {
            link: payload.link || "/",
            category: payload.category,
            entityId: payload.entityId || "",
            entityType: payload.entityType || "",
        }).catch(console.error);
    } catch (err) {
        console.error("[NotificationService] deliverNotifications error:", err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RBAC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Notify all administrators, optionally limited to one organization. */
async function notifyAdmins(payload: NotificationPayload, organizationId?: string): Promise<void> {
    const admins = await prisma.user.findMany({
        where: { role: "administrator", isActive: true, ...(organizationId ? { organizationId } : {}) },
        select: { id: true },
    });
    const ids = admins.map((u) => u.id);
    await deliverNotifications(ids, payload);
}

/** Notify all hiring managers whose department matches. */
async function notifyHiringManagersByDepartment(
    department: string,
    payload: NotificationPayload
): Promise<void> {
    const hms = await prisma.user.findMany({
        where: {
            role: "hiring_manager",
            isActive: true,
            department: { equals: department, mode: "insensitive" },
        },
        select: { id: true },
    });
    const ids = hms.map((u) => u.id);
    await deliverNotifications(ids, payload);
}

/**
 * Notify the entire hiring team of a job:
 * recruiter + hiring manager + team members (but NOT admins — they get notified separately).
 */
async function notifyJobTeam(
    jobId: string,
    payload: NotificationPayload
): Promise<void> {
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
            recruiterId: true,
            hiringManagerId: true,
            hiringTeamMembers: { select: { id: true } },
        },
    });
    if (!job) return;

    const ids = [
        job.recruiterId,
        job.hiringManagerId,
        ...job.hiringTeamMembers.map((m) => m.id),
    ].filter(Boolean) as string[];

    await deliverNotifications(ids, payload);
}

/** Notify a single user. */
async function notifyUser(
    userId: string,
    payload: NotificationPayload
): Promise<void> {
    await deliverNotifications([userId], payload);
}

/** Notify a list of specific users. */
async function notifyUsers(
    userIds: string[],
    payload: NotificationPayload
): Promise<void> {
    await deliverNotifications(userIds, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN-SPECIFIC NOTIFICATION CREATORS
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyNewCandidate(opts: {
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    jobDepartment: string;
    isReferral: boolean;
    referrerUserId?: string;
}): Promise<void> {
    const { candidateId, candidateName, jobId, jobTitle, jobDepartment, isReferral, referrerUserId } = opts;
    const category = isReferral ? NotificationCategory.REFERRAL : NotificationCategory.CANDIDATE;
    const title = isReferral
        ? `New referral: ${candidateName}`
        : `New candidate: ${candidateName}`;
    const body = `Applied for ${jobTitle}`;
    const link = `/candidates/${candidateId}`;

    const payload: NotificationPayload = { title, body, category, link, entityId: candidateId, entityType: "Candidate" };

    // Admin gets all notifications
    await notifyAdmins(payload);
    // Hiring managers of the same department
    await notifyHiringManagersByDepartment(jobDepartment, payload);
    // Job team (recruiter + team members)
    await notifyJobTeam(jobId, payload);

    // If referral, also notify the referrer
    if (isReferral && referrerUserId) {
        await notifyUser(referrerUserId, {
            title: `Your referral was submitted`,
            body: `${candidateName} has been added to the ${jobTitle} pipeline`,
            category: NotificationCategory.REFERRAL,
            link,
            entityId: candidateId,
            entityType: "Candidate",
        });
    }
}

export async function notifyCandidateStageChange(opts: {
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    jobDepartment: string;
    fromStage: string | null;
    toStage: string;
    changedByName: string;
}): Promise<void> {
    const { candidateId, candidateName, jobId, jobTitle, jobDepartment, toStage, changedByName } = opts;

    let category = NotificationCategory.CANDIDATE;
    if (toStage === "HIRED") category = NotificationCategory.CANDIDATE;
    if (toStage === "OFFER_SENT") category = NotificationCategory.CANDIDATE;

    const title = `${candidateName} moved to ${formatStage(toStage)}`;
    const body = `For ${jobTitle} · by ${changedByName}`;
    const link = `/candidates/${candidateId}`;
    const payload: NotificationPayload = { title, body, category, link, entityId: candidateId, entityType: "Candidate" };

    await notifyAdmins(payload);
    await notifyHiringManagersByDepartment(jobDepartment, payload);
    await notifyJobTeam(jobId, payload);
}

export async function notifyReferralRejected(opts: {
    referrerUserId: string;
    candidateName: string;
    jobTitle: string;
    candidateId: string;
}): Promise<void> {
    const { referrerUserId, candidateName, jobTitle, candidateId } = opts;
    await notifyUser(referrerUserId, {
        title: `Referral update: ${candidateName}`,
        body: `Your referral for ${jobTitle} was not selected at this time`,
        category: NotificationCategory.REFERRAL,
        link: `/candidates/${candidateId}`,
        entityId: candidateId,
        entityType: "Candidate",
    });
}

export async function notifyJobCreated(opts: {
    jobId: string;
    jobTitle: string;
    jobDepartment: string;
    createdByName: string;
}): Promise<void> {
    const { jobId, jobTitle, jobDepartment, createdByName } = opts;
    const payload: NotificationPayload = {
        title: `New job posted: ${jobTitle}`,
        body: `${jobDepartment} · by ${createdByName}`,
        category: NotificationCategory.JOB,
        link: `/jobs/${jobId}`,
        entityId: jobId,
        entityType: "Job",
    };

    // Admins see all
    await notifyAdmins(payload);
    // Hiring managers of that department
    await notifyHiringManagersByDepartment(jobDepartment, payload);
}

export async function notifyJobUpdated(opts: {
    jobId: string;
    jobTitle: string;
    jobDepartment: string;
    updatedByName: string;
    statusChange?: string;
}): Promise<void> {
    const { jobId, jobTitle, jobDepartment, updatedByName, statusChange } = opts;
    const body = statusChange
        ? `Status changed to ${statusChange} by ${updatedByName}`
        : `Updated by ${updatedByName}`;
    const payload: NotificationPayload = {
        title: `Job updated: ${jobTitle}`,
        body,
        category: NotificationCategory.JOB,
        link: `/jobs/${jobId}`,
        entityId: jobId,
        entityType: "Job",
    };

    await notifyAdmins(payload);
    await notifyHiringManagersByDepartment(jobDepartment, payload);
    await notifyJobTeam(jobId, payload);
}

export async function notifyHiringTeamInvite(opts: {
    invitedUserId: string;
    inviterName: string;
    jobTitle: string;
    jobId: string;
}): Promise<void> {
    const { invitedUserId, inviterName, jobTitle, jobId } = opts;
    await notifyUser(invitedUserId, {
        title: `You've been invited to a hiring team`,
        body: `${inviterName} invited you to help hire for ${jobTitle}`,
        category: NotificationCategory.JOB,
        link: `/jobs/${jobId}`,
        entityId: jobId,
        entityType: "Job",
    });
}

export async function notifyInterviewScheduled(opts: {
    interviewId: string;
    candidateName: string;
    jobTitle: string;
    jobDepartment: string;
    jobId: string;
    scheduledAt: Date;
    interviewType: string;
    panelistIds: string[];
    scheduledByName: string;
}): Promise<void> {
    const { interviewId, candidateName, jobTitle, jobDepartment, jobId, scheduledAt, interviewType, panelistIds, scheduledByName } = opts;

    const dateStr = scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const payload: NotificationPayload = {
        title: `Interview scheduled: ${candidateName}`,
        body: `${interviewType} interview for ${jobTitle} on ${dateStr}`,
        category: NotificationCategory.INTERVIEW,
        link: `/interviews`,
        entityId: interviewId,
        entityType: "Interview",
    };

    await notifyAdmins(payload);
    await notifyHiringManagersByDepartment(jobDepartment, payload);

    // Panelists get personal notification
    if (panelistIds.length) {
        await notifyUsers(panelistIds, {
            title: `You have an interview: ${candidateName}`,
            body: `${interviewType} for ${jobTitle} on ${dateStr}`,
            category: NotificationCategory.INTERVIEW,
            link: `/interviews`,
            entityId: interviewId,
            entityType: "Interview",
        });
    }
}

export async function notifyInterviewUpdated(opts: {
    interviewId: string;
    candidateName: string;
    jobTitle: string;
    jobDepartment: string;
    panelistIds: string[];
    updatedByName: string;
    isRescheduled: boolean;
    scheduledAt?: Date;
}): Promise<void> {
    const { interviewId, candidateName, jobTitle, jobDepartment, panelistIds, updatedByName, isRescheduled, scheduledAt } = opts;

    const body = isRescheduled && scheduledAt
        ? `Rescheduled to ${scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} by ${updatedByName}`
        : `Updated by ${updatedByName}`;

    const title = isRescheduled
        ? `Interview rescheduled: ${candidateName}`
        : `Interview updated: ${candidateName}`;

    const payload: NotificationPayload = {
        title,
        body,
        category: NotificationCategory.INTERVIEW,
        link: `/interviews`,
        entityId: interviewId,
        entityType: "Interview",
    };

    await notifyAdmins(payload);
    await notifyHiringManagersByDepartment(jobDepartment, payload);

    if (panelistIds.length) {
        await notifyUsers(panelistIds, {
            ...payload,
            title: isRescheduled ? `Your interview rescheduled: ${candidateName}` : title,
        });
    }
}

export async function notifyInterviewReminder(opts: {
    userId: string;
    interviewId: string;
    candidateName: string;
    scheduledAt: Date;
}): Promise<void> {
    const { userId, interviewId, candidateName, scheduledAt } = opts;
    
    // Time format e.g. 10:00 AM
    const timeStr = scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    
    await notifyUser(userId, {
        title: `Interview starting soon`,
        body: `Your interview with ${candidateName} starts at ${timeStr}`,
        category: NotificationCategory.INTERVIEW,
        link: `/interviews`,
        entityId: interviewId,
        entityType: "Interview",
    });
}

export async function notifyMailReceived(opts: {
    recipientUserIds: string[];
    senderName: string;
    subject: string;
    threadId: string;
}): Promise<void> {
    const { recipientUserIds, senderName, subject, threadId } = opts;
    if (!recipientUserIds.length) return;
    await notifyUsers(recipientUserIds, {
        title: `New mail from ${senderName}`,
        body: subject,
        category: NotificationCategory.MAIL,
        link: `/mail`,
        entityId: threadId,
        entityType: "EmailThread",
    });
}

export async function notifyUserOnboarded(opts: {
    newUserId: string;
    newUserName: string;
    newUserRole: string;
    organizationId: string;
}): Promise<void> {
    const { newUserName, newUserRole, organizationId } = opts;
    await notifyAdmins({
        title: `New team member joined`,
        body: `${newUserName} accepted their invitation as ${newUserRole}`,
        category: NotificationCategory.USER_MANAGEMENT,
        link: `/settings`,
        entityType: "User",
    }, organizationId);
}

// ─────────────────────────────────────────────────────────────────────────────
// FCM TOKEN REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

export async function registerFcmToken(userId: string, token: string): Promise<void> {
    await notificationRepository.upsertFcmToken(userId, token);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatStage(stage: string): string {
    return stage
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
}

export { notificationRepository };
