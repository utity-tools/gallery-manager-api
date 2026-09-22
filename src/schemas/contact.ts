import { z } from "zod";

export const CreateContactMessageSchema = z.object({
  name: z
    .string()
    .min(1, "name is required")
    .max(100, "name must be 100 characters or fewer"),
  email: z.string().email("email must be a valid email address"),
  message: z
    .string()
    .min(1, "message is required")
    .max(1000, "message must be 1000 characters or fewer"),
  subject: z
    .string()
    .max(200, "subject must be 200 characters or fewer")
    .optional(),
});

export type CreateContactMessageInput = z.infer<
  typeof CreateContactMessageSchema
>;
