import { Router } from "express";
import usersController from "./users.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";
import organizationController from "../organization/organization.controller";
import { updatePreferencesSchema } from "../organization/organization.validation";

import {
    getUsersSchema,
    getUserByIdSchema,
    updateUserSchema,
    deleteUserSchema,
    updateMeSchema,
    inviteUserSchema,
    acceptInvitationSchema,
} from "./users.validation";

const router = Router();

// Current user profile
router.get(
    "/me",
    authenticateUser,
    usersController.getMe
);

router.patch(
    "/me",
    authenticateUser,
    validate(updateMeSchema),
    usersController.updateMe
);

// Personal appearance preferences (never affect organization branding)
router.get(
    "/me/preferences",
    authenticateUser,
    organizationController.getPreferences
);

router.put(
    "/me/preferences",
    authenticateUser,
    validate(updatePreferencesSchema),
    organizationController.updatePreferences
);

// Admin-only user management
router.get(
    "/",
    authenticateUser,
    requireRole("administrator"),
    validate(getUsersSchema),
    usersController.getAllUsers
);

router.get(
    "/:id",
    authenticateUser,
    requireRole("administrator"),
    validate(getUserByIdSchema),
    usersController.getUserById
);

router.patch(
    "/:id",
    authenticateUser,
    requireRole("administrator"),
    validate(updateUserSchema),
    usersController.updateUser
);

router.delete(
    "/:id",
    authenticateUser,
    requireRole("administrator"),
    validate(deleteUserSchema),
    usersController.deleteUser
);

// Invitations
router.post(
    "/invite",
    authenticateUser,
    requireRole("administrator"),
    validate(inviteUserSchema),
    usersController.inviteUser
);

router.get(
    "/invitations/:token",
    usersController.getInvitation
);

router.post(
    "/invitations/:token/accept",
    validate(acceptInvitationSchema),
    usersController.acceptInvitation
);

export default router;
