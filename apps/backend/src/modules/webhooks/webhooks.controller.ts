import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as webhooksService from "./webhooks.service";

export const receiveWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const event = await webhooksService.processWebhook({
            source: req.params.source,
            headers: req.headers as Record<string, string>,
            payload: req.body,
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Webhook received",
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

const webhooksController = {
    receiveWebhook,
};

export default webhooksController;
