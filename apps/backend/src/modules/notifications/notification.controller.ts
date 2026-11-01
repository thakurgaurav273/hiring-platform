import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import notificationRepository from "./notification.repository";
import { registerFcmToken } from "./notification.service";

const notificationController = {
    /**
     * GET /notifications
     * Returns paginated notifications for the authenticated user.
     */
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 30;

            const result = await notificationRepository.findByUser(userId, { page, limit });

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Notifications retrieved successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /notifications/unread-count
     * Returns unread notification count for the authenticated user.
     */
    async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const count = await notificationRepository.countUnread(userId);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Unread count retrieved",
                data: { count },
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PATCH /notifications/:id/read
     * Marks a single notification as read for the authenticated user.
     */
    async markRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { id } = req.params;

            await notificationRepository.markRead(id, userId);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Notification marked as read",
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PATCH /notifications/read-all
     * Marks all notifications as read for the authenticated user.
     */
    async markAllRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            await notificationRepository.markAllRead(userId);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "All notifications marked as read",
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /notifications/fcm-token
     * Registers or updates the browser FCM token for the authenticated user.
     */
    async registerToken(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { token } = req.body;

            if (!token || typeof token !== "string") {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "FCM token is required",
                });
            }

            await registerFcmToken(userId, token);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: "FCM token registered",
            });
        } catch (err) {
            next(err);
        }
    },
};

export default notificationController;
