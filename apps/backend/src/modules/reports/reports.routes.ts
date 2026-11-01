import { Router } from "express";
import reportsController from "./reports.controller";
import authenticateUser from "../../common/middlewares/auth.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";

const router = Router();

router.get(
    "/",
    authenticateUser,
    requireRole("administrator", "hiring_manager"),
    reportsController.getReports
);

export default router;
