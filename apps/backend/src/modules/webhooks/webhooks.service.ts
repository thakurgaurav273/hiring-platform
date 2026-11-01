import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";

export interface WebhookPayload {
    source: string;
    headers: Record<string, string>;
    payload: Record<string, any>;
}

/**
 * processWebhook — Validates the incoming webhook and dispatches to the
 * correct handler based on source (e.g. 'greenhouse', 'lever', 'slack').
 *
 * Extend this with HMAC signature verification per provider.
 */
export const processWebhook = async (data: WebhookPayload) => {
    const { source, headers, payload } = data;

    const supportedSources = ["greenhouse", "lever", "slack", "stripe", "generic"];

    if (!supportedSources.includes(source)) {
        throw new AppError(
            `Unsupported webhook source: ${source}`,
            StatusCodes.BAD_REQUEST
        );
    }

    // Log the event (in production, dispatch to a queue / event processor)
    console.log(`[Webhook] Received from source="${source}"`, {
        event: payload.event || payload.type || "unknown",
        timestamp: new Date().toISOString(),
    });

    return {
        source,
        received: true,
        event: payload.event || payload.type || "unknown",
        processedAt: new Date().toISOString(),
    };
};
