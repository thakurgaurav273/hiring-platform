import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import validate from "../../common/middlewares/validate.middleware";
import { resumeUpload } from "../../common/middlewares/document-upload.middleware";
import { AppError } from "../../common/errors/app-error";
import { rateLimitEnabled } from "../../config/env";
import * as careersService from "./careers.service";
import { applyBodySchema, careersJobParamsSchema, careersListQuerySchema } from "./careers.validation";

// Public, unauthenticated endpoints for careers pages and the website embed.
// Mounted at /api/v1/public/careers.
const router = Router();

/**
 * Application submissions are always rate-limited, even when the global API
 * limiter is off for local development (with a looser limit there).
 */
const applyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: rateLimitEnabled ? 10 : 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many applications from this network. Please try again later." },
});

const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: rateLimitEnabled ? 120 : 2000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please slow down." },
});

const wrap =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) =>
        fn(req, res).catch(next);

router.get(
    "/:orgSlug",
    readLimiter,
    validate(careersListQuerySchema),
    wrap(async (req, res) => {
        const data = await careersService.listJobs(req.params.orgSlug, req.query as never);
        res.set("Cache-Control", "public, max-age=60");
        res.status(StatusCodes.OK).json({ success: true, data });
    })
);

router.get(
    "/:orgSlug/jobs/:jobId",
    readLimiter,
    validate(careersJobParamsSchema),
    wrap(async (req, res) => {
        const data = await careersService.getJob(req.params.orgSlug, req.params.jobId, (req.query as { channel?: "careers" | "embed" })?.channel);
        res.set("Cache-Control", "public, max-age=60");
        res.status(StatusCodes.OK).json({ success: true, data });
    })
);

router.post(
    "/:orgSlug/jobs/:jobId/apply",
    applyLimiter,
    validate(careersJobParamsSchema),
    resumeUpload.single("resume"),
    wrap(async (req, res) => {
        const parsed = applyBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            throw new AppError(first?.message ?? "Please check the form and try again", StatusCodes.BAD_REQUEST);
        }
        const data = await careersService.apply(req.params.orgSlug, req.params.jobId, parsed.data, req.file);
        res.status(StatusCodes.CREATED).json({ success: true, message: "Application received", data });
    })
);

export default router;
