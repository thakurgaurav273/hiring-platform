import { z } from "zod";
import { JobType, JobStatus } from "@/constants/enums";

export const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  department: z.string().min(2, "Department must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  type: z.nativeEnum(JobType),
  openings: z.preprocess((v) => Number(v), z.number().int().min(1, "At least 1 opening is required")),
  experience: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0, "Experience cannot be negative").optional()
  ),
  deadline: z.string(),
  status: z.nativeEnum(JobStatus),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

export type JobFormValues = z.infer<typeof jobSchema>;
