import prisma from "../../database/prisma-client";
import { Prisma, PipelineStage } from "@prisma/client";

const countActiveJobs = async (where?: Prisma.JobWhereInput) => {
    return prisma.job.count({
        where: {
            ...where,
            status: "OPEN"
        }
    });
};

const countActiveCandidates = async (where?: Prisma.CandidateWhereInput) => {
    const activeStageFilter: Prisma.CandidateWhereInput = {
        applications: {
            some: {
                currentStage: {
                    in: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "TECHNICAL_ROUND", "HR_ROUND"],
                },
            },
        },
    };

    return prisma.candidate.count({
        where: {
            AND: [
                where ?? {},
                activeStageFilter,
            ],
        },
    });
};

const countCandidatesByStage = async (stage: PipelineStage, where?: Prisma.CandidateWhereInput) => {
    return prisma.candidate.count({
        where: {
            AND: [
                where ?? {},
                { applications: { some: { currentStage: stage } } },
            ],
        },
    });
};

const countUpcomingInterviews = async (where?: Prisma.InterviewWhereInput) => {
    return prisma.interview.count({
        where: {
            ...where,
            status: "SCHEDULED",
            scheduledAt: { gte: new Date() },
        },
    });
};

const countCandidates = async (where?: Prisma.CandidateWhereInput) => {
    return prisma.candidate.count({ where });
};

const getFunnelCounts = async (where?: Prisma.ApplicationWhereInput) => {
    const results = await prisma.application.groupBy({
        by: ["currentStage"],
        _count: { id: true },
        where,
    });
    return results;
};

const getRecentApplications = async (where?: Prisma.ApplicationWhereInput) => {
    return prisma.application.findMany({
        take: 5,
        where,
        orderBy: { createdAt: "desc" },
        include: {
            candidate: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
            job: {
                select: { id: true, title: true, department: true },
            },
        },
    });
};

const getUpcomingInterviews = async (where?: Prisma.InterviewWhereInput) => {
    return prisma.interview.findMany({
        take: 5,
        where: {
            ...where,
            status: "SCHEDULED",
            scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        include: {
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true } },
                    job: { select: { id: true, title: true, department: true } },
                }
            }
        },
    });
};

const getAverageTimeToHire = async (where?: Prisma.CandidateWhereInput) => {
    const hiredCandidates = await prisma.candidate.findMany({
        where: {
            AND: [
                where ?? {},
                { applications: { some: { currentStage: "HIRED" } } },
            ],
        },
        select: { createdAt: true },
    });

    if (hiredCandidates.length === 0) return 0;

    const totalDays = hiredCandidates.reduce((acc, c) => {
        return acc + (Date.now() - new Date(c.createdAt).getTime()) / 86400000;
    }, 0);

    return Math.round(totalDays / hiredCandidates.length);
};

const getRecentEvents = async (where?: Prisma.TimelineEventWhereInput) => {
    return prisma.timelineEvent.findMany({
        take: 5,
        where,
        orderBy: { createdAt: "desc" },
    });
};

const getRecentEmails = async (where?: Prisma.EmailWhereInput) => {
    return prisma.email.findMany({
        take: 5,
        where,
        orderBy: { createdAt: "desc" },
    });
};

const getRecentActivities = async (where?: Prisma.ActivityLogWhereInput) => {
    return prisma.activityLog.findMany({
        take: 6,
        where,
        orderBy: { createdAt: "desc" },
    });
};

export default {
    countActiveJobs,
    countActiveCandidates,
    countCandidatesByStage,
    countUpcomingInterviews,
    countCandidates,
    getFunnelCounts,
    getRecentApplications,
    getUpcomingInterviews,
    getAverageTimeToHire,
    getRecentEvents,
    getRecentEmails,
    getRecentActivities,
};
