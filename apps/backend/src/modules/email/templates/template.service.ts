export type EmailTemplateType =
    | "APPLICATION_RECEIVED"
    | "INTERVIEW_SCHEDULED"
    | "OFFER_LETTER"
    | "REJECTION"
    | "CUSTOM";

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

const templates: Record<EmailTemplateType, (data: Record<string, any>) => EmailTemplate> = {
    APPLICATION_RECEIVED: (data) => ({
        subject: `Application Received — ${data.jobTitle}`,
        html: `<p>Hi ${data.candidateName},</p><p>Thank you for applying for <strong>${data.jobTitle}</strong>. We have received your application and will be in touch shortly.</p><p>Best regards,<br/>${data.companyName}</p>`,
        text: `Hi ${data.candidateName},\n\nThank you for applying for ${data.jobTitle}. We have received your application and will be in touch shortly.\n\nBest regards,\n${data.companyName}`,
    }),

    INTERVIEW_SCHEDULED: (data) => ({
        subject: `Interview Scheduled — ${data.jobTitle}`,
        html: `<p>Hi ${data.candidateName},</p><p>Your interview for <strong>${data.jobTitle}</strong> has been scheduled for <strong>${data.scheduledAt}</strong>.</p><p>Location/Link: ${data.location || "TBD"}</p><p>Best regards,<br/>${data.companyName}</p>`,
        text: `Hi ${data.candidateName},\n\nYour interview for ${data.jobTitle} has been scheduled for ${data.scheduledAt}.\nLocation/Link: ${data.location || "TBD"}\n\nBest regards,\n${data.companyName}`,
    }),

    OFFER_LETTER: (data) => ({
        subject: `Offer Letter — ${data.jobTitle} at ${data.companyName}`,
        html: `<p>Hi ${data.candidateName},</p><p>We are pleased to offer you the position of <strong>${data.jobTitle}</strong> at ${data.companyName}.</p><p>Please review the attached offer letter and confirm your acceptance by <strong>${data.deadline}</strong>.</p><p>Best regards,<br/>${data.companyName}</p>`,
        text: `Hi ${data.candidateName},\n\nWe are pleased to offer you the position of ${data.jobTitle} at ${data.companyName}.\nPlease review the attached offer letter and confirm your acceptance by ${data.deadline}.\n\nBest regards,\n${data.companyName}`,
    }),

    REJECTION: (data) => ({
        subject: `Application Update — ${data.jobTitle}`,
        html: `<p>Hi ${data.candidateName},</p><p>Thank you for your interest in the <strong>${data.jobTitle}</strong> position at ${data.companyName}. After careful consideration, we have decided not to move forward with your application at this time.</p><p>We appreciate your time and encourage you to apply for future openings.</p><p>Best regards,<br/>${data.companyName}</p>`,
        text: `Hi ${data.candidateName},\n\nThank you for your interest in the ${data.jobTitle} position at ${data.companyName}. After careful consideration, we have decided not to move forward with your application at this time.\n\nWe appreciate your time and encourage you to apply for future openings.\n\nBest regards,\n${data.companyName}`,
    }),

    CUSTOM: (data) => ({
        subject: data.subject || "No Subject",
        html: data.html || data.body || "",
        text: data.text || data.body || "",
    }),
};

export const renderTemplate = (
    type: EmailTemplateType,
    data: Record<string, any>
): EmailTemplate => {
    const templateFn = templates[type];
    if (!templateFn) {
        throw new Error(`Unknown email template type: ${type}`);
    }
    return templateFn(data);
};
