import prisma from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

/** Total applications count */
const countApplications = async (where?: Prisma.ApplicationWhereInput) => {
    return prisma.application.count({ where });
};

/** Total scheduled interviews */
const countScheduledInterviews = async (where?: Prisma.InterviewWhereInput) => {
    return prisma.interview.count({
        where: {
            AND: [where ?? {}, { status: "SCHEDULED" }],
        },
    });
};

/** Candidates that received an offer */
const countOffersSent = async (where?: Prisma.ApplicationWhereInput) => {
    return prisma.application.count({
        where: {
            AND: [where ?? {}, { currentStage: "OFFER_SENT" }],
        },
    });
};

/** Candidates that were hired */
const countHired = async (where?: Prisma.ApplicationWhereInput) => {
    return prisma.application.count({
        where: {
            AND: [where ?? {}, { currentStage: "HIRED" }],
        },
    });
};

/** Avg days from application creation to HIRED — only for hired applications */
const getAvgTimeToHire = async (where?: Prisma.ApplicationWhereInput) => {
    const hired = await prisma.application.findMany({
        where: {
            AND: [where ?? {}, { currentStage: "HIRED" }],
        },
        select: { createdAt: true, updatedAt: true },
    });

    if (hired.length === 0) return 0;

    const totalDays = hired.reduce((acc, a) => {
        return acc + (new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime()) / 86_400_000;
    }, 0);

    return Math.round(totalDays / hired.length);
};

/**
 * Applications grouped by week for the last 4 weeks.
 * Returns an array of { week: "W1" | "W2" | "W3" | "W4", count: number }
 */
const getApplicationsOverTime = async (where?: Prisma.ApplicationWhereInput) => {
    const now = new Date();
    const weeks = Array.from({ length: 4 }, (_, i) => {
        const end = new Date(now.getTime() - i * 7 * 86_400_000);
        const start = new Date(end.getTime() - 7 * 86_400_000);
        return { label: `W${4 - i}`, start, end };
    }).reverse();

    const counts = await Promise.all(
        weeks.map(async (w) => {
            const count = await prisma.application.count({
                where: {
                    AND: [
                        where ?? {},
                        { createdAt: { gte: w.start, lt: w.end } },
                    ],
                },
            });
            return { week: w.label, count };
        })
    );

    return counts;
};

/**
 * Applications grouped by department (admin-only chart).
 * Returns an array of { department: string, count: number }
 */
const getApplicationsPerDepartment = async (where?: Prisma.ApplicationWhereInput) => {
    const results = await prisma.application.groupBy({
        by: ["jobId"],
        where,
        _count: { id: true },
    });

    // Enrich with job department
    const jobIds = results.map((r) => r.jobId);
    const jobs = await prisma.job.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, department: true },
    });

    const jobMap = new Map(jobs.map((j) => [j.id, j.department]));

    const deptMap = new Map<string, number>();
    for (const r of results) {
        const dept = jobMap.get(r.jobId) ?? "Other";
        deptMap.set(dept, (deptMap.get(dept) ?? 0) + r._count.id);
    }

    return Array.from(deptMap.entries())
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count);
};

/**
 * Recruitment funnel: count per stage in the ordered list.
 * Stages: APPLIED → SCREENING → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED → TECHNICAL_ROUND → HR_ROUND → HIRED
 */
const getFunnelStages = async (where?: Prisma.ApplicationWhereInput) => {
    const STAGES = [
        "APPLIED",
        "SCREENING",
        "SHORTLISTED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEW_COMPLETED",
        "TECHNICAL_ROUND",
        "HR_ROUND",
        "HIRED",
    ] as const;

    const LABELS: Record<string, string> = {
        APPLIED: "Applied",
        SCREENING: "Screening",
        SHORTLISTED: "Shortlisted",
        INTERVIEW_SCHEDULED: "Interview Scheduled",
        INTERVIEW_COMPLETED: "Interview Completed",
        TECHNICAL_ROUND: "Technical Round",
        HR_ROUND: "HR Round",
        HIRED: "Hired",
    };

    const results = await Promise.all(
        STAGES.map(async (stage, index) => {
            const applicableStages = STAGES.slice(index);

            const count = await prisma.application.count({
                where: {
                    AND: [
                        where ?? {},
                        {
                            OR: [
                                { currentStage: { in: [...applicableStages] as any } },
                                { history: { some: { fromStage: { in: [...applicableStages] as any } } } },
                                { history: { some: { toStage: { in: [...applicableStages] as any } } } },
                            ],
                        },
                    ],
                },
            });

            return {
                stage: LABELS[stage],
                value: count,
            };
        })
    );

    return results;
};

/**
 * Applications per source, with how many reached an interview and how many
 * were hired. "Reached an interview" = has an interview scheduled, or is (or
 * was) in an interview stage or later.
 */
const INTERVIEW_OR_LATER = ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "TECHNICAL_ROUND", "HR_ROUND", "OFFER_SENT", "HIRED"] as const;

const getSourceBreakdown = async (where?: Prisma.ApplicationWhereInput) => {
    const scope = where ?? {};
    const [all, interviewed, hired] = await Promise.all([
        prisma.application.groupBy({ by: ["sourceType"], where: scope, _count: { id: true } }),
        prisma.application.groupBy({
            by: ["sourceType"],
            where: {
                AND: [
                    scope,
                    {
                        OR: [
                            { interviews: { some: {} } },
                            { currentStage: { in: [...INTERVIEW_OR_LATER] } },
                            { history: { some: { toStage: { in: [...INTERVIEW_OR_LATER] } } } },
                        ],
                    },
                ],
            },
            _count: { id: true },
        }),
        prisma.application.groupBy({ by: ["sourceType"], where: { AND: [scope, { currentStage: "HIRED" }] }, _count: { id: true } }),
    ]);
    const count = (rows: typeof all, type: string) => rows.find((r) => r.sourceType === type)?._count.id ?? 0;
    return all
        .map((r) => ({
            sourceType: r.sourceType,
            applications: r._count.id,
            interviewed: count(interviewed, r.sourceType),
            hired: count(hired, r.sourceType),
        }))
        .sort((a, b) => b.applications - a.applications);
};

export default {
    countApplications,
    countScheduledInterviews,
    countOffersSent,
    countHired,
    getAvgTimeToHire,
    getApplicationsOverTime,
    getApplicationsPerDepartment,
    getFunnelStages,
    getSourceBreakdown,
};
