import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { StatusCodes } from "http-status-codes";
import authenticateUser from "../../common/middlewares/auth.middleware";
import { requireRole } from "../../common/middlewares/roles.middleware";
import validate from "../../common/middlewares/validate.middleware";
import * as distributionService from "./distribution.service";

// Mounted at /api/v1/distribution. Acts on jobs in the caller's organization.
const router = Router();
router.use(authenticateUser, requireRole("recruiter", "hiring_manager"));

const jobParams = z.object({ params: z.object({ jobId: z.string().uuid() }) });
const setSchema = z.object({
    params: z.object({
        jobId: z.string().uuid(),
        channel: z.enum(["CAREERS_PAGE", "WEBSITE_EMBED", "LINKEDIN", "INDEED", "NAUKRI"]),
    }),
    body: z.object({ action: z.enum(["publish", "pause", "unpublish"]) }).strict(),
});

const actor = (req: Request) => ({ id: req.user!.id, organizationId: req.user!.organizationId });
const wrap =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) =>
        fn(req, res).catch(next);

router.get(
    "/jobs/:jobId",
    validate(jobParams),
    wrap(async (req, res) => {
        const data = await distributionService.getDistribution(req.params.jobId, actor(req));
        res.status(StatusCodes.OK).json({ success: true, message: "Distribution fetched", data });
    })
);

router.put(
    "/jobs/:jobId/:channel",
    validate(setSchema),
    wrap(async (req, res) => {
        await distributionService.setPublication(req.params.jobId, req.params.channel as never, req.body.action, actor(req));
        const data = await distributionService.getDistribution(req.params.jobId, actor(req));
        res.status(StatusCodes.OK).json({ success: true, message: "Publication updated", data });
    })
);

export default router;
