import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";

const validate =
    (schema: AnyZodObject) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            req.body = parsed.body;
            req.query = parsed.query;
            req.params = parsed.params;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.flatten().fieldErrors,
                });
            }

            next(error);
        }
    };

export default validate;