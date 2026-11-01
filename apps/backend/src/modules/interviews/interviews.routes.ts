import { Router } from "express";
import * as interviewsController from "./interviews.controller";
import authenticateUser from "../../common/middlewares/auth.middleware";
import { requireRole as authorize } from "../../common/middlewares/roles.middleware";
import { Role } from "@prisma/client";

const router = Router();

// All interview routes require authentication
router.use(authenticateUser);

// Create an interview (Managers, Recruiters)
router.post(
    "/",
    authorize(Role.hiring_manager, Role.recruiter, Role.administrator),
    interviewsController.createInterview
);

// Get interviews (all users can view according to RBAC in service)
router.get(
    "/",
    interviewsController.getInterviews
);

// Get interview by ID
router.get(
    "/:id",
    interviewsController.getInterviewById
);

// Update interview (e.g. status)
router.patch(
    "/:id",
    authorize(Role.hiring_manager, Role.administrator),
    interviewsController.updateInterview
);

export default router;
