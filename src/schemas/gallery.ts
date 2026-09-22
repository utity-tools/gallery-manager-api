import { z } from "zod";

// IANA timezone validation (e.g., "Europe/Madrid", "America/New_York")
const ianaTimezoneRegex = /^[A-Za-z_]+\/[A-Za-z_]+$/;

// Hours shape: { "monday": [{ "start": "10:00", "close": "14:00" }, ...], "sunday": null }
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format
const hoursSchema = z.record(
  z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  z
    .array(
      z.object({
        start: z.string().regex(timeRegex),
        close: z.string().regex(timeRegex),
      }),
    )
    .nullable(),
);

export const UpdateGallerySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  theme: z.enum(["light", "dark"]).optional(),

  // About Us page fields
  aboutHeading: z
    .string()
    .max(200, "aboutHeading must be 200 characters or fewer")
    .optional(),
  aboutText: z
    .string()
    .max(3000, "aboutText must be 3000 characters or fewer")
    .optional(),
  aboutPhotoUrl: z.string().url("aboutPhotoUrl must be a valid URL").optional(),

  // Branding & Logo
  logoUrl: z.string().url("logoUrl must be a valid URL").optional(),
  logoDarkUrl: z.string().url("logoDarkUrl must be a valid URL").optional(),

  // Contact & Footer
  contactEmail: z
    .string()
    .email("contactEmail must be a valid email")
    .optional(),
  phone: z.string().optional(),
  whatsappUrl: z.string().url("whatsappUrl must be a valid URL").optional(),
  googleMapsUrl: z.string().url("googleMapsUrl must be a valid URL").optional(),

  // Social links
  instagramUrl: z.string().url("instagramUrl must be a valid URL").optional(),
  facebookUrl: z.string().url("facebookUrl must be a valid URL").optional(),
  xUrl: z.string().url("xUrl must be a valid URL").optional(),
  linkedinUrl: z.string().url("linkedinUrl must be a valid URL").optional(),

  // Address
  addressLine: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Hours & Timezone
  hours: hoursSchema.optional(),
  hoursNote: z
    .string()
    .max(500, "hoursNote must be 500 characters or fewer")
    .optional(),
  timezone: z
    .string()
    .regex(
      ianaTimezoneRegex,
      "timezone must be a valid IANA timezone (e.g., Europe/Madrid)",
    )
    .optional(),

  // SEO & Meta
  metaTitle: z
    .string()
    .max(200, "metaTitle must be 200 characters or fewer")
    .optional(),
  metaDescription: z
    .string()
    .max(500, "metaDescription must be 500 characters or fewer")
    .optional(),
  ogImageUrl: z.string().url("ogImageUrl must be a valid URL").optional(),

  // Legal & Compliance
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  privacyPolicyUrl: z
    .string()
    .url("privacyPolicyUrl must be a valid URL")
    .optional(),

  // Announcements
  announcementText: z
    .string()
    .max(500, "announcementText must be 500 characters or fewer")
    .optional(),
  announcementUrl: z
    .string()
    .url("announcementUrl must be a valid URL")
    .optional(),
  announcementEnabled: z.boolean().optional(),

  // Hero carousel
  heroArtworkIds: z
    .array(z.string())
    .max(4, "heroArtworkIds can contain max 4 items")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "heroArtworkIds must not contain duplicates",
    )
    .optional(),

  // Future fields
  newsletterUrl: z.string().url("newsletterUrl must be a valid URL").optional(),
  showPrices: z.boolean().optional(),
});

export type UpdateGalleryInput = z.infer<typeof UpdateGallerySchema>;
