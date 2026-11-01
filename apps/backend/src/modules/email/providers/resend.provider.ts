/**
 * ResendProvider — Placeholder for Resend.com email integration.
 * Requires: npm install resend
 *
 * To activate:
 *   1. npm install resend
 *   2. Set RESEND_API_KEY environment variable
 *   3. Uncomment the implementation below
 */

export interface SendEmailParams {
    from?: string;
    to: string | string[];
    cc?: string[];
    subject: string;
    html?: string;
    text?: string;
}

export interface SendEmailResult {
    id: string;
    success: boolean;
}

export class ResendProvider {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
    }

    async send(params: SendEmailParams): Promise<SendEmailResult> {
        if (!this.apiKey) {
            throw new Error(
                "ResendProvider: RESEND_API_KEY is not set. Please set it in your environment variables."
            );
        }

        /**
         * To enable: npm install resend, then replace this block with:
         *
         * const { Resend } = require('resend');
         * const resend = new Resend(this.apiKey);
         * const result = await resend.emails.send({
         *   from: params.from || process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
         *   to: params.to,
         *   cc: params.cc,
         *   subject: params.subject,
         *   html: params.html,
         *   text: params.text,
         * });
         * return { id: result.id, success: true };
         */
        throw new Error(
            "ResendProvider is not yet enabled. Install the 'resend' package and configure RESEND_API_KEY."
        );
    }
}
