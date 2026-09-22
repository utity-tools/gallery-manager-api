import { z } from "zod";

export const CreateExhibitionSchema = z.object({
  title: z.string().min(1, "Title required"),
  venue: z.string().optional(),
  country: z.string().optional(),
  year: z.number().int().optional(),
  description: z.string().optional(),
});

export const UpdateExhibitionSchema = CreateExhibitionSchema.partial();

export type CreateExhibitionInput = z.infer<typeof CreateExhibitionSchema>;
export type UpdateExhibitionInput = z.infer<typeof UpdateExhibitionSchema>;
