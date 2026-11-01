import { Router } from "express";
import pipelineController from "./pipeline.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";

import {
    createTemplateSchema,
    updateTemplateSchema,
    getTemplateByIdSchema,
    getTemplateByJobIdSchema,
    getHistoryByApplicationIdSchema,
} from "./pipeline.validation";

const router = Router();

// Template routes
router.post(
    "/templates",
    authenticateUser,
    requireRole("administrator", "recruiter"),
    validate(createTemplateSchema),
    pipelineController.createTemplate
);

router.get(
    "/templates",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager"),
    pipelineController.getAllTemplates
);

router.get(
    "/templates/:id",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager"),
    validate(getTemplateByIdSchema),
    pipelineController.getTemplateById
);

router.get(
    "/templates/job/:jobId",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager"),
    validate(getTemplateByJobIdSchema),
    pipelineController.getTemplateByJobId
);

router.patch(
    "/templates/:id",
    authenticateUser,
    requireRole("administrator", "recruiter"),
    validate(updateTemplateSchema),
    pipelineController.updateTemplate
);

router.delete(
    "/templates/:id",
    authenticateUser,
    requireRole("administrator", "recruiter"),
    validate(getTemplateByIdSchema),
    pipelineController.deleteTemplate
);

// History routes
router.get(
    "/history/:applicationId",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager"),
    validate(getHistoryByApplicationIdSchema),
    pipelineController.getHistoryForApplication
);

export default router;
