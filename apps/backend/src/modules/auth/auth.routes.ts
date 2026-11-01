import { Router } from "express";
import authController from "./auth.controller";
import validate from "../../common/middlewares/validate.middleware";
import authenticateUser from "../../common/middlewares/auth.middleware";

import {
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema,
    logoutSchema,
} from "./auth.validation";

const router = Router();

router.post(
    "/login",
    validate(loginSchema),
    authController.login
);



router.post(
    "/logout",
    validate(logoutSchema),
    authenticateUser,
    authController.logout
);

router.post(
    "/refresh-token",
    validate(refreshTokenSchema),
    authController.refreshToken
);

router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    authController.forgotPassword
);

router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    authController.resetPassword
);

router.patch(
    "/change-password",
    validate(changePasswordSchema),
    authenticateUser,
    authController.changePassword
);
export default router;