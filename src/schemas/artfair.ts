import { z } from "zod";

export const CreateArtFairSchema = z.object({
  name: z.string().min(1, "Name required"),
  country: z.string().optional(),
  year: z.number().int().optional(),
});

export const UpdateArtFairSchema = CreateArtFairSchema.partial();

export type CreateArtFairInput = z.infer<typeof CreateArtFairSchema>;
export type UpdateArtFairInput = z.infer<typeof UpdateArtFairSchema>;
