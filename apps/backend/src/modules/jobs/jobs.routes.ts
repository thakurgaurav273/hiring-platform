import { Router } from "express";
import jobsController from "./jobs.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";

import {
    createJobSchema,
    updateJobSchema,
    getJobsSchema,
    getJobByIdSchema,
} from "./jobs.validation";
import { z } from "zod";

const inviteSchema = z.object({
    body: z.object({
        userId: z.string().uuid("Invalid user ID format"),
    }),
});

const acceptInviteSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
    }),
});

const router = Router();

router.post(
    "/",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(createJobSchema),
    jobsController.createJob
);

router.get(
    "/",
    authenticateUser,
    requireRole("recruiter", "hiring_manager", "employee"),
    validate(getJobsSchema),
    jobsController.getAllJobs
);

router.get(
    "/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager", "employee"),
    validate(getJobByIdSchema),
    jobsController.getJobById
);

router.patch(
    "/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(updateJobSchema),
    jobsController.updateJob
);

router.delete(
    "/:id",
    authenticateUser,
    requireRole("recruiter"),
    validate(getJobByIdSchema),
    jobsController.deleteJob
);

router.get(
    "/:id/eligible-team-members",
    authenticateUser,
    requireRole("administrator", "hiring_manager", "recruiter"),
    jobsController.getEligibleTeamMembers
);

router.post(
    "/:id/hiring-team/invite",
    authenticateUser,
    requireRole("administrator", "hiring_manager"),
    validate(inviteSchema),
    jobsController.inviteToHiringTeam
);

router.post(
    "/invitations/accept",
    authenticateUser,
    validate(acceptInviteSchema),
    jobsController.acceptHiringTeamInvitation
);

export default router;