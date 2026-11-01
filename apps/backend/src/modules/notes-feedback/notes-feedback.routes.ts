import { Router } from "express";
import notesController from "./notes-feedback.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";

import {
    createNoteSchema,
    updateNoteSchema,
    getNotesSchema,
    getNoteByIdSchema,
    deleteNoteSchema,
    createFeedbackSchema,
    updateFeedbackSchema,
    getFeedbacksSchema,
    getFeedbackByIdSchema,
    deleteFeedbackSchema,
} from "./notes-feedback.validation";

const router = Router();

// Notes Routes
router.post(
    "/notes",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(createNoteSchema),
    notesController.createNote
);

router.get(
    "/notes",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(getNotesSchema),
    notesController.getAllNotes
);

router.get(
    "/notes/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(getNoteByIdSchema),
    notesController.getNoteById
);

router.patch(
    "/notes/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(updateNoteSchema),
    notesController.updateNote
);

router.delete(
    "/notes/:id",
    authenticateUser,
    requireRole("recruiter"),
    validate(deleteNoteSchema),
    notesController.deleteNote
);

// Feedback Routes
router.post(
    "/feedbacks",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(createFeedbackSchema),
    notesController.createFeedback
);

router.get(
    "/feedbacks",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(getFeedbacksSchema),
    notesController.getAllFeedbacks
);

router.get(
    "/feedbacks/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(getFeedbackByIdSchema),
    notesController.getFeedbackById
);

router.patch(
    "/feedbacks/:id",
    authenticateUser,
    requireRole("recruiter", "hiring_manager"),
    validate(updateFeedbackSchema),
    notesController.updateFeedback
);

router.delete(
    "/feedbacks/:id",
    authenticateUser,
    requireRole("recruiter"),
    validate(deleteFeedbackSchema),
    notesController.deleteFeedback
);

export default router;
