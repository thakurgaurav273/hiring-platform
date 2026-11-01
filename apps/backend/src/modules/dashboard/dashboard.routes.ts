import { Router } from "express";
import dashboardController from "./dashboard.controller";

import authenticateUser from "../../common/middlewares/auth.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";

const router = Router();

router.get(
    "/",
    authenticateUser,
    requireRole("administrator", "hiring_manager", "recruiter", "employee"),
    dashboardController.getDashboard
);

export default router;
