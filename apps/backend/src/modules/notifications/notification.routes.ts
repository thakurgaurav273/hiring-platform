import { Router } from "express";
import authenticateUser from "../../common/middlewares/auth.middleware";
import notificationController from "./notification.controller";

const router = Router();

// All notification routes require authentication
router.get("/", authenticateUser, notificationController.getNotifications);
router.get("/unread-count", authenticateUser, notificationController.getUnreadCount);
router.patch("/read-all", authenticateUser, notificationController.markAllRead);
router.patch("/:id/read", authenticateUser, notificationController.markRead);
router.post("/fcm-token", authenticateUser, notificationController.registerToken);

export default router;
