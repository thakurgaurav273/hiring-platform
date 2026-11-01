import nodemailer from "nodemailer";
import { EmailProvider } from "./email-provider.interface";

export class SmtpProvider implements EmailProvider {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "localhost",
            port: Number(process.env.SMTP_PORT) || 587, // default to production SMTP port
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
            auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            } : undefined,
        });
    }

    async sendEmail(
        to: string,
        subject: string,
        body: string,
        html?: string,
        from?: string,
        cc?: string,
        attachments?: any[]
    ): Promise<boolean> {
        try {
            const mailOptions = {
                from: from || process.env.EMAIL_FROM || "Grovyn Talent <no-reply@grovyn.com>",
                to,
                cc,
                subject,
                text: body,
                html: html || body,
                attachments: attachments?.map(a => ({
                    filename: a.filename,
                    content: Buffer.from(a.content, "base64"),
                    contentType: a.contentType
                }))
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error("Error sending email via SMTP:", error);
            return false;
        }
    }
}
