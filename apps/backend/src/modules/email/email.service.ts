import { EmailProvider } from "./providers/email-provider.interface";
import { SmtpProvider } from "./providers/smtp.provider";

import { prisma } from "../../database/prisma-client";
import { EmailDirection, EmailStatus } from "@prisma/client";

interface SendEmailOptions {
    to: string | string[];
    cc?: string[];
    subject: string;
    body: string;
    html?: string;
    from?: string;
    attachments?: any[];
}

interface SendPlatformEmailOptions {
    fromUserId: string;
    to: string | string[];
    cc?: string[];
    subject: string;
    body: string;
    html?: string;
    candidateId?: string;
    threadId?: string;
    attachments?: any[];
}

class EmailService {
    private provider: EmailProvider;

    constructor() {
        this.provider = new SmtpProvider();
    }

    /**
     * Generic send — used by the email controller for any outbound email.
     */
    async sendEmail(opts: SendEmailOptions): Promise<boolean> {
        const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
        const cc = opts.cc ? opts.cc.join(", ") : undefined;
        return this.provider.sendEmail(to, opts.subject, opts.body, opts.html, opts.from, cc, opts.attachments);
    }

    /**
     * Send platform email — used by users to send tracked emails (e.g. to candidates or internal users)
     */
    async sendPlatformEmail(opts: SendPlatformEmailOptions) {
        // 1. Get sender info
        const sender = await prisma.user.findUnique({ where: { id: opts.fromUserId } });
        if (!sender) throw new Error("Sender not found");
        
        const fromEmail = sender.email;
        const fromString = `${sender.firstName} ${sender.lastName} <${fromEmail}>`;

        // 2. Resolve or create thread
        let threadId = opts.threadId;
        if (!threadId) {
            const thread = await prisma.emailThread.create({
                data: {
                    subject: opts.subject,
                    candidateId: opts.candidateId,
                }
            });
            threadId = thread.id;
        }

        // 3. Prepare recipients
        const toArray = Array.isArray(opts.to) ? opts.to : [opts.to];
        const toListString = toArray.join(", ");
        
        // 4. Save email to DB
        await prisma.email.create({
            data: {
                fromUserId: sender.id,
                to: toListString,
                cc: opts.cc || [],
                subject: opts.subject,
                body: opts.body,
                direction: EmailDirection.OUTBOUND,
                threadId: threadId,
                candidateId: opts.candidateId,
                status: EmailStatus.SENT,
                attachments: opts.attachments || [],
            }
        });

        // 5. Update/Create UserEmailThread for sender (Sent mailbox)
        await prisma.userEmailThread.upsert({
            where: { userId_threadId: { userId: sender.id, threadId } },
            create: { userId: sender.id, threadId, isUnread: false },
            update: { isUnread: false }
        });

        // 6. Find internal recipients
        const allRecipients = [...toArray, ...(opts.cc || [])];
        const internalUsers = await prisma.user.findMany({
            where: { email: { in: allRecipients } }
        });

        // 7. Update/Create UserEmailThread for internal recipients (Inbox mailbox)
        for (const internalUser of internalUsers) {
            await prisma.userEmailThread.upsert({
                where: { userId_threadId: { userId: internalUser.id, threadId } },
                create: { userId: internalUser.id, threadId, isUnread: true },
                update: { isUnread: true, isArchived: false }
            });
        }

        // 7b. Fire in-app notification for internal recipients (fire-and-forget)
        if (internalUsers.length > 0) {
            const senderName = `${sender.firstName} ${sender.lastName}`;
            const recipientUserIds = internalUsers.map(u => u.id);
            const { notifyMailReceived } = await import("../notifications/notification.service");
            notifyMailReceived({
                recipientUserIds,
                senderName,
                subject: opts.subject,
                threadId: threadId!,
            }).catch(console.error);
        }

        // 8. Deliver via SMTP
        return this.sendEmail({
            to: opts.to,
            cc: opts.cc,
            subject: opts.subject,
            body: opts.body,
            html: opts.html,
            from: fromString,
            attachments: opts.attachments,
        });
    }


    async sendResetPasswordEmail(data: { to: string; token: string }) {
        const { to, token } = data;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        const subject = "Reset your Grovyn Talent password";

        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0F766E; margin: 0;">Grovyn Talent</h2>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #111827; margin-top: 0; font-size: 20px;">Reset your password</h3>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    We received a request to reset the password for your Grovyn Talent account. 
                    This link will expire in 24 hours.
                </p>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${resetLink}" style="display: inline-block; background-color: #0F766E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    If the button doesn't work, copy and paste the following link into your browser:<br/>
                    <a href="${resetLink}" style="color: #0F766E; word-break: break-all;">${resetLink}</a>
                </p>
            </div>
        </div>
        `;

        const plainText = `
Reset your Grovyn Talent password

We received a request to reset the password for your Grovyn Talent account.
This link will expire in 24 hours.

Reset Password: ${resetLink}

If you didn't request a password reset, you can safely ignore this email.
        `.trim();

        return this.provider.sendEmail(to, subject, plainText, html);
    }

    async sendInvitationEmail(data: { to: string; token: string; role: string }) {
        const { to, token, role } = data;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const inviteLink = `${frontendUrl}/accept-invitation?token=${token}`;
        
        // Capitalize role for display
        const displayRole = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        const subject = "You've been invited to Grovyn Talent";

        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0F766E; margin: 0;">Grovyn Talent</h2>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #111827; margin-top: 0; font-size: 20px;">You've been invited!</h3>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    You have been invited to join the Grovyn Talent workspace as a <strong>${displayRole}</strong>. 
                    Please accept the invitation to set up your account. This link is valid for 7 days.
                </p>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${inviteLink}" style="display: inline-block; background-color: #0F766E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                        Accept Invitation
                    </a>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    If the button doesn't work, copy and paste the following link into your browser:<br/>
                    <a href="${inviteLink}" style="color: #0F766E; word-break: break-all;">${inviteLink}</a>
                </p>
            </div>
        </div>
        `;

        const plainText = `
You've been invited to Grovyn Talent

You have been invited to join the Grovyn Talent workspace as a ${displayRole}.
Please accept the invitation to set up your account. This link is valid for 7 days.

Accept Invitation: ${inviteLink}
        `.trim();

        return this.provider.sendEmail(to, subject, plainText, html);
    }

    async sendJobInvitationEmail(data: { to: string; token: string; jobTitle: string; inviterName: string }) {
        const { to, token, jobTitle, inviterName } = data;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const inviteLink = `${frontendUrl}/accept-job-invitation?token=${token}`;

        const subject = `You've been invited to the hiring team for ${jobTitle}`;

        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0F766E; margin: 0;">Grovyn Talent</h2>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #111827; margin-top: 0; font-size: 20px;">Hiring Team Invitation</h3>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    <strong>${inviterName}</strong> has invited you to join the hiring team for the <strong>${jobTitle}</strong> position.
                    Please accept the invitation to get access to the job's candidates and pipeline. This link is valid for 7 days.
                </p>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${inviteLink}" style="display: inline-block; background-color: #0F766E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                        Accept Invitation
                    </a>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    If the button doesn't work, copy and paste the following link into your browser:<br/>
                    <a href="${inviteLink}" style="color: #0F766E; word-break: break-all;">${inviteLink}</a>
                </p>
            </div>
        </div>
        `;

        const plainText = `
Hiring Team Invitation

${inviterName} has invited you to join the hiring team for the ${jobTitle} position.
Please accept the invitation to get access to the job's candidates and pipeline. This link is valid for 7 days.

Accept Invitation: ${inviteLink}
        `.trim();

        return this.provider.sendEmail(to, subject, plainText, html);
    }

    async sendCandidateRejectionEmail(data: { to: string; candidateName: string; jobTitle: string }) {
        const { to, candidateName, jobTitle } = data;
        const subject = `Update regarding your application for ${jobTitle}`;

        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0F766E; margin: 0;">Grovyn Talent</h2>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Hi ${candidateName},
                </p>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Thank you for taking the time to apply and interview for the <strong>${jobTitle}</strong> position at our company. We appreciate the opportunity to learn more about your background and experience.
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    After careful consideration, our team has decided to move forward with other candidates whose qualifications more closely align with our current needs for this role.
                </p>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    We will keep your resume on file and reach out if a suitable opening becomes available in the future. We wish you the best of luck in your job search and future professional endeavors.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Regards,<br/>
                    The Grovyn Talent Recruiting Team
                </p>
            </div>
        </div>
        `;

        const plainText = `
Hi ${candidateName},

Thank you for taking the time to apply and interview for the ${jobTitle} position at our company. We appreciate the opportunity to learn more about your background and experience.

After careful consideration, our team has decided to move forward with other candidates whose qualifications more closely align with our current needs for this role.

We will keep your resume on file and reach out if a suitable opening becomes available in the future. We wish you the best of luck in your job search and future professional endeavors.

Regards,
The Grovyn Talent Recruiting Team
        `.trim();

        return this.provider.sendEmail(to, subject, plainText, html);
    }

    async sendReferrerRejectionEmail(data: { to: string; referrerName: string; candidateName: string; jobTitle: string }) {
        const { to, referrerName, candidateName, jobTitle } = data;
        const subject = `Update on your referral: ${candidateName} for ${jobTitle}`;

        const plainText = `
Hi ${referrerName},

Thank you for referring ${candidateName} for the ${jobTitle} role. 

We wanted to let you know that our team has reviewed their profile and, after careful consideration, decided to move forward with other candidates at this time.

We truly appreciate your efforts in helping us find great talent, and encourage you to continue submitting referrals for future openings!

Best regards,
The Recruiting Team
        `.trim();

        return this.provider.sendEmail(to, subject, plainText);
    }

    async sendCandidateReferralAddedEmail(data: { to: string; candidateName: string; referrerName: string; jobTitle: string }) {
        const { to, candidateName, referrerName, jobTitle } = data;
        const subject = `You've been referred for ${jobTitle} at Grovyn Talent!`;

        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0F766E; margin: 0;">Grovyn Talent</h2>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Hi ${candidateName},
                </p>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Great news! <strong>${referrerName}</strong> has referred you for the <strong>${jobTitle}</strong> position.
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Our recruiting team will review your profile and reach out if there is a match with our current requirements.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Best regards,<br/>
                    The Grovyn Talent Recruiting Team
                </p>
            </div>
        </div>
        `;

        const plainText = `
Hi ${candidateName},

Great news! ${referrerName} has referred you for the ${jobTitle} position.

Our recruiting team will review your profile and reach out if there is a match with our current requirements.

Best regards,
The Grovyn Talent Recruiting Team
        `.trim();

        return this.provider.sendEmail(to, subject, plainText, html);
    }

    async sendReferrerReferralAddedEmail(data: { to: string; referrerName: string; candidateName: string; jobTitle: string }) {
        const { to, referrerName, candidateName, jobTitle } = data;
        const subject = `Referral Received: ${candidateName} for ${jobTitle}`;

        const plainText = `
Hi ${referrerName},

Thank you for referring ${candidateName} to the ${jobTitle} position. 

We've successfully added their profile to our system. Our recruiting team will review their application and we'll keep you updated on their progress.

Thanks for helping us grow the team!

Best regards,
The Recruiting Team
        `.trim();

        return this.provider.sendEmail(to, subject, plainText);
    }
}

export const emailService = new EmailService();
