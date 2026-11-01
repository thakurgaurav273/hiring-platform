import { z } from "zod";

export const composeMailSchema = z.object({
  from: z.string().min(1, "Sender is required"),
  to: z.string().min(1, "Recipient is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().optional(),
});

export type ComposeMailFormValues = z.infer<typeof composeMailSchema>;
