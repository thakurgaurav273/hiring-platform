import { Request, Response, NextFunction } from "express";

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

/**
 * asyncHandler — Wraps an async route handler and forwards errors to next().
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler =
    (fn: AsyncController) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
