export interface EmailProvider {
    sendEmail(
        to: string,
        subject: string,
        body: string,
        html?: string,
        from?: string,
        cc?: string,
        attachments?: any[]
    ): Promise<boolean>;
}
