import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

