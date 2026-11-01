import { Router } from "express";

import candidateController from "./candidates.controller";
import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";

import {
    createCandidateSchema,
    updateCandidateSchema,
    getCandidatesSchema,
    getCandidateByIdSchema,
    updateCandidateStageSchema,
    deleteCandidateSchema,
} from "./candidates.validation";

const router = Router();

import { upload } from "../../common/middlewares/upload.middleware";

router.post(
    "/",
    authenticateUser,
    requireRole("recruiter", "hiring_manager", "employee"),
    upload.single("resume"),
    validate(createCandidateSchema),
    candidateController.createCandidate
);

router.get(
    "/",
    authenticateUser,
    requireRole("recruiter", "hiring_manager", "employee"),
    validate(getCandidatesSchema),
    candidateController.getAllCandidates
);

router.get(
    "/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager", "employee"),
    validate(getCandidateByIdSchema),
    candidateController.getCandidateById
);

router.patch(
    "/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(updateCandidateSchema),
    candidateController.updateCandidate
);

router.patch(
    "/:id/stage",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(updateCandidateStageSchema),
    candidateController.updateCandidateStage
);

router.put(
    "/:id/stage",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(updateCandidateStageSchema),
    candidateController.updateCandidateStage
);

router.delete(
    "/:id",
    authenticateUser,
    requireRole("recruiter"),
    validate(deleteCandidateSchema),
    candidateController.deleteCandidate
);

router.get(
    "/:id/notes",
    authenticateUser,
    candidateController.getCandidateNotes
);

router.post(
    "/:id/notes",
    authenticateUser,
    candidateController.addCandidateNote
);

router.get(
    "/:id/timeline",
    authenticateUser,
    candidateController.getCandidateTimeline
);

export default router;