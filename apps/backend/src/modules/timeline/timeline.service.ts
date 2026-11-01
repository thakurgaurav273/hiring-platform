import timelineRepository from "./timeline.repository";
import { Prisma, Role } from "@prisma/client";
import prisma from "../../database/prisma-client";

export const logActivity = async (data: {
    type: string;
    actorId?: string;
    entityType: string;
    entityId: string;
    description: string;
    department?: string | null;
    metadata?: any;
}) => {
    try {
        let candidateId: string | undefined = undefined;

        if (data.entityType === 'Candidate') {
            candidateId = data.entityId;
        } else if (data.entityType === 'Application') {
            const app = await prisma.application.findUnique({ where: { id: data.entityId }, select: { candidateId: true } });
            candidateId = app?.candidateId;
        } else if (data.entityType === 'Interview') {
            const int = await prisma.interview.findUnique({ where: { id: data.entityId }, select: { application: { select: { candidateId: true } } } });
            candidateId = int?.application?.candidateId;
        } else if (data.entityType === 'Note') {
            const note = await prisma.note.findUnique({ where: { id: data.entityId }, select: { candidateId: true } });
            candidateId = note?.candidateId;
        } else if (data.entityType === 'Email') {
            const email = await prisma.email.findUnique({ where: { id: data.entityId }, select: { candidateId: true } });
            candidateId = email?.candidateId || undefined;
        }

        return await timelineRepository.logActivity({ ...data, candidateId });
    } catch (err) {
        // Logging failures must never crash the main operation
        console.error("[Timeline] logActivity failed:", err);
    }
};

export const getDailyCounts = async (
    user: { id: string; role: string; department?: string | null; organizationId: string },
    startDate: string,
    endDate: string
) => {
    // Tenant isolation: only activity by members of this organization.
    const where: Prisma.DailyActivityCountWhereInput = { actor: { organizationId: user.organizationId } };

    if (user.role === Role.hiring_manager) {
        if (user.department) {
            where.department = { equals: user.department, mode: "insensitive" };
        } else {
            where.department = "NONE_ASSIGNED_TO_THIS_USER";
        }
    } else if (user.role === Role.recruiter || user.role === Role.employee) {
        where.actorId = user.id;
    }
    // administrator sees all (where remains empty)

    return await timelineRepository.getDailyCounts(where, startDate, endDate);
};

export const getTodaysActivities = async (
    user: { id: string; role: string; department?: string | null; organizationId: string }
) => {
    const where: Prisma.ActivityLogWhereInput = {
        // Tenant isolation: activity by this organization\'s members or on its candidates.
        AND: [{ OR: [{ actor: { organizationId: user.organizationId } }, { candidate: { organizationId: user.organizationId } }] }],};

    if (user.role === Role.hiring_manager) {
        if (user.department) {
            where.department = { equals: user.department, mode: "insensitive" };
        } else {
            where.department = "NONE_ASSIGNED_TO_THIS_USER";
        }
    } else if (user.role === Role.recruiter || user.role === Role.employee) {
        where.actorId = user.id;
    }
    // administrator sees all

    return await timelineRepository.getTodaysActivities(where);
};
