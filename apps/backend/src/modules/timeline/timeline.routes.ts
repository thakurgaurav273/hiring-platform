import { Router } from "express";
import authenticateUser from "../../common/middlewares/auth.middleware";
import * as timelineController from "./timeline.controller";

const router = Router();

router.use(authenticateUser);

router.get("/heatmap", timelineController.getHeatmap);
router.get("/today", timelineController.getTodayLedger);

export default router;
