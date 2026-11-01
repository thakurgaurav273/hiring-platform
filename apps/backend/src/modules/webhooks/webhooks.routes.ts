import { Router } from "express";
import webhooksController from "./webhooks.controller";

const router = Router();

/**
 * Webhooks are intentionally unauthenticated (public endpoints).
 * Security is enforced via HMAC signature verification in the service layer.
 */
router.post("/:source", webhooksController.receiveWebhook);

export default router;
