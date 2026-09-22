import { z } from "zod";

export const CreateArtistSchema = z.object({
  name: z.string().min(1, "Name required").max(255),
  country: z.string().optional(),
  birthYear: z.number().int().min(1000).max(2100).optional(),
  bio: z.string().max(2000).optional(),
  photoUrl: z.string().url("photoUrl must be a valid URL").optional(),
  // Free text or a URL — a gallery may paste CV text directly rather than
  // link to a document, so this intentionally isn't URL-validated.
  cv: z.string().optional(),
  biographyPhotoUrl: z
    .string()
    .url("biographyPhotoUrl must be a valid URL")
    .optional(),
  biographyHeading: z
    .string()
    .max(200, "biographyHeading must be 200 characters or fewer")
    .optional(),
  biographyText: z
    .string()
    .max(3000, "biographyText must be 3000 characters or fewer")
    .optional(),
});

// featuredArtworkIds only makes sense on update — a freshly-created artist
// has no artworks yet to feature.
export const UpdateArtistSchema = CreateArtistSchema.partial().extend({
  featuredArtworkIds: z.array(z.string()).optional(),
});

export type CreateArtistInput = z.infer<typeof CreateArtistSchema>;
export type UpdateArtistInput = z.infer<typeof UpdateArtistSchema>;
