import { Router } from "express";
import resumesController from "./resumes.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";
import { upload } from "../../common/middlewares/upload.middleware";

const router = Router();

router.post(
    "/candidate/:candidateId",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager", "employee"),
    upload.single("resume"),
    resumesController.uploadResume
);

router.get(
    "/candidate/:candidateId",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager", "employee"),
    resumesController.getResumesByCandidateId
);

router.get(
    "/:id",
    authenticateUser,
    requireRole("administrator", "recruiter", "hiring_manager"),
    resumesController.getResumeById
);

router.delete(
    "/:id",
    authenticateUser,
    requireRole("administrator", "recruiter"),
    resumesController.deleteResume
);

export default router;
