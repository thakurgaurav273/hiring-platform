import prisma from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

class TimelineRepository {
    async logActivity(data: {
        type: string;
        actorId?: string;
        entityType: string;
        entityId: string;
        description: string;
        department?: string | null;
        candidateId?: string;
        metadata?: any;
    }) {
        const dateString = new Date().toISOString().split("T")[0];

        return await prisma.$transaction(async (tx) => {
            // 1. Create the detailed activity log
            const activityLog = await tx.activityLog.create({
                data: {
                    type: data.type,
                    actorId: data.actorId,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    description: data.description,
                    department: data.department,
                    candidateId: data.candidateId,
                    metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
                },
            });

            // 2. Upsert the daily count (only if actorId is present)
            if (data.actorId) {
                await tx.dailyActivityCount.upsert({
                    where: {
                        date_actorId: {
                            date: dateString,
                            actorId: data.actorId,
                        },
                    },
                    update: {
                        count: { increment: 1 },
                        department: data.department, // Ensure it's kept updated if changed
                    },
                    create: {
                        date: dateString,
                        actorId: data.actorId,
                        department: data.department,
                        count: 1,
                    },
                });
            }

            return activityLog;
        });
    }

    async getDailyCounts(where: Prisma.DailyActivityCountWhereInput, startDate: string, endDate: string) {
        // Find counts within the date range, grouped by date
        const counts = await prisma.dailyActivityCount.groupBy({
            by: ['date'],
            where: {
                ...where,
                date: {
                    gte: startDate,
                    lte: endDate,
                }
            },
            _sum: {
                count: true,
            },
        });

        // Convert array to a record: { "YYYY-MM-DD": count }
        const result: Record<string, number> = {};
        for (const item of counts) {
            result[item.date] = item._sum.count || 0;
        }

        return result;
    }

    async getTodaysActivities(where: Prisma.ActivityLogWhereInput) {
        // Today bounds in UTC
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        return await prisma.activityLog.findMany({
            where: {
                ...where,
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay,
                }
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 100, // Reasonable limit for today's UI list
        });
    }
}

export default new TimelineRepository();
