import { Router } from "express";
import emailController from "./email.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";

import { upload } from "../../common/middlewares/upload.middleware";

import {
    sendEmailSchema,
    getEmailByIdSchema,
    getEmailsSchema,
    getEmailsByThreadIdSchema,
    getEmailsByCandidateIdSchema,
    getThreadsSchema,
    updateThreadSchema,
} from "./email.validation";

const router = Router();

router.post(
    "/",
    authenticateUser,
    validate(sendEmailSchema),
    emailController.sendEmail
);

router.get(
    "/threads",
    authenticateUser,
    validate(getThreadsSchema),
    emailController.getThreads
);

router.get(
    "/counts",
    authenticateUser,
    emailController.getMailboxCounts
);

router.patch(
    "/thread/:threadId",
    authenticateUser,
    validate(updateThreadSchema),
    emailController.updateThreadState
);

router.delete(
    "/thread/:threadId",
    authenticateUser,
    emailController.deleteThread
);

router.get(
    "/thread/:threadId",
    authenticateUser,
    emailController.getThreadById
);

router.get(
    "/candidate/:candidateId",
    authenticateUser,
    validate(getEmailsByCandidateIdSchema),
    emailController.getEmailsByCandidateId
);

router.get(
    "/candidate/:candidateId/threads",
    authenticateUser,
    emailController.getCandidateThreads
);

router.get(
    "/:id",
    authenticateUser,
    validate(getEmailByIdSchema),
    emailController.getEmailById
);

router.post(
    "/:id/reply",
    authenticateUser,
    emailController.replyToEmail
);

router.post(
    "/:id/attachments",
    authenticateUser,
    upload.single("attachment"),
    emailController.uploadAttachment
);

export default router;
