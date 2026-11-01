import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import jobRoutes from "../modules/jobs/jobs.routes";
import candidateRoutes from "../modules/candidates/candidates.routes";
import notesFeedbackRoutes from "../modules/notes-feedback/notes-feedback.routes";
import pipelineRoutes from "../modules/pipeline/pipeline.routes";
import timelineRoutes from "../modules/timeline/timeline.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import usersRoutes from "../modules/users/users.routes";
import emailRoutes from "../modules/email/email.routes";
import resumesRoutes from "../modules/resumes/resumes.routes";
import webhooksRoutes from "../modules/webhooks/webhooks.routes";
import interviewsRoutes from "../modules/interviews/interviews.routes";
import reportsRoutes from "../modules/reports/reports.routes";
import notificationsRoutes from "../modules/notifications/notification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);
router.use("/candidates", candidateRoutes);
router.use("/pipeline", pipelineRoutes);
router.use("/timeline", timelineRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", usersRoutes);
router.use("/mail", emailRoutes);
router.use("/resumes", resumesRoutes);
router.use("/webhooks", webhooksRoutes);
router.use("/interviews", interviewsRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/", notesFeedbackRoutes);

export default router;