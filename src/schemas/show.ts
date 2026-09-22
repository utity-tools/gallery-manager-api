import { z } from "zod";

const BaseShowSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  coverImageUrl: z.string().url("coverImageUrl must be a valid URL").optional(),
  isPublic: z.boolean().optional(),
  artistIds: z.array(z.string()).optional(),
  // Order matters: position within the show = index in this array.
  artworkIds: z.array(z.string()).optional(),
});

function refineDateRange<T extends { startDate?: Date; endDate?: Date }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
}

export const CreateShowSchema = BaseShowSchema.superRefine(refineDateRange);
export const UpdateShowSchema =
  BaseShowSchema.partial().superRefine(refineDateRange);

export type CreateShowInput = z.infer<typeof CreateShowSchema>;
export type UpdateShowInput = z.infer<typeof UpdateShowSchema>;
