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

            // Only replace the parts the schema declares. Schemas without
            // `params` used to wipe req.params, which broke routes such as
            // POST /users/invitations/:token/accept.
            if (parsed.body !== undefined) req.body = parsed.body;
            if (parsed.query !== undefined) req.query = parsed.query;
            if (parsed.params !== undefined) req.params = parsed.params;

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