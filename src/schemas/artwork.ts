import { z } from "zod";

// imageUrl is required (not optional) to preserve the previously-established
// contract: an artwork must have an image at creation time.
export const CreateArtworkSchema = z.object({
  title: z.string().min(1, "Title required"),
  artistId: z.string().min(1, "artistId required"),
  year: z.number().int().optional(),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  imageUrl: z.string().url("imageUrl must be a valid URL"),
});

export const UpdateArtworkSchema = CreateArtworkSchema.partial();

export type CreateArtworkInput = z.infer<typeof CreateArtworkSchema>;
export type UpdateArtworkInput = z.infer<typeof UpdateArtworkSchema>;
