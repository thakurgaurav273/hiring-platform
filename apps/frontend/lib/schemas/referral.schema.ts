import { z } from "zod";

export const referralSchema = z.object({
  jobId: z.string().min(1, "Please select a job"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),
  education: z.string().optional(),
  portfolio: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  summary: z.string().optional(),
  whySuggest: z.string().optional(),
});

export type ReferralFormValues = z.infer<typeof referralSchema>;
