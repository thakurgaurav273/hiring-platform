import prisma from "../../database/prisma-client";
import { NotificationCategory } from "@prisma/client";

export interface CreateNotificationInput {
    userId: string;
    title: string;
    body: string;
    category: NotificationCategory;
    link?: string;
    entityId?: string;
    entityType?: string;
}

const notificationRepository = {
    async createMany(records: CreateNotificationInput[]) {
        if (!records.length) return;
        return prisma.notification.createMany({ data: records });
    },

    async findByUser(
        userId: string,
        { page = 1, limit = 30 }: { page?: number; limit?: number }
    ) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where: { userId } }),
        ]);

        return {
            notifications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async markRead(notificationId: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    },

    async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    },

    async countUnread(userId: string) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    },

    async upsertFcmToken(userId: string, token: string) {
        return prisma.fcmToken.upsert({
            where: { token },
            update: { userId },
            create: { userId, token },
        });
    },

    async getFcmTokensForUsers(userIds: string[]): Promise<string[]> {
        if (!userIds.length) return [];
        const tokens = await prisma.fcmToken.findMany({
            where: { userId: { in: userIds } },
            select: { token: true },
        });
        return tokens.map((t) => t.token);
    },
};

export default notificationRepository;
