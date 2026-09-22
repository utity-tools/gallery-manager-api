import { Gallery } from "@prisma/client";
import { ArtistSummaryDTO } from "./ArtistDTO";
import { ArtworkDTO } from "./ArtworkDTO";

// Kept as the full non-sensitive Gallery shape (nothing on this model needs
// redacting) so it works for both the owner view and the public slug view.
export class GalleryDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  theme: string;

  // About Us page
  aboutHeading: string | null;
  aboutText: string | null;
  aboutPhotoUrl: string | null;

  // Branding & Logo
  logoUrl: string | null;
  logoDarkUrl: string | null;

  // Contact & Footer
  contactEmail: string | null;
  phone: string | null;
  whatsappUrl: string | null;
  googleMapsUrl: string | null;

  // Social links
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;

  // Address
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;

  // Hours & Timezone
  hours: Record<string, Array<{ start: string; close: string }> | null> | null;
  hoursNote: string | null;
  timezone: string | null;

  // SEO & Meta
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;

  // Legal & Compliance
  legalName: string | null;
  taxId: string | null;
  privacyPolicyUrl: string | null;

  // Announcements
  announcementText: string | null;
  announcementUrl: string | null;
  announcementEnabled: boolean;

  // Hero carousel
  heroArtworkIds: string[];

  // Future fields
  newsletterUrl: string | null;
  showPrices: boolean;

  createdAt: Date;
  updatedAt: Date;

  constructor(gallery: Gallery) {
    this.id = gallery.id;
    this.userId = gallery.userId;
    this.title = gallery.title;
    this.description = gallery.description;
    this.isPublic = gallery.isPublic;
    this.theme = gallery.theme;

    this.aboutHeading = gallery.aboutHeading;
    this.aboutText = gallery.aboutText;
    this.aboutPhotoUrl = gallery.aboutPhotoUrl;

    this.logoUrl = gallery.logoUrl;
    this.logoDarkUrl = gallery.logoDarkUrl;

    this.contactEmail = gallery.contactEmail;
    this.phone = gallery.phone;
    this.whatsappUrl = gallery.whatsappUrl;
    this.googleMapsUrl = gallery.googleMapsUrl;

    this.instagramUrl = gallery.instagramUrl;
    this.facebookUrl = gallery.facebookUrl;
    this.xUrl = gallery.xUrl;
    this.linkedinUrl = gallery.linkedinUrl;

    this.addressLine = gallery.addressLine;
    this.city = gallery.city;
    this.postalCode = gallery.postalCode;
    this.country = gallery.country;

    this.hours = gallery.hours as Record<
      string,
      Array<{ start: string; close: string }> | null
    > | null;
    this.hoursNote = gallery.hoursNote;
    this.timezone = gallery.timezone;

    this.metaTitle = gallery.metaTitle;
    this.metaDescription = gallery.metaDescription;
    this.ogImageUrl = gallery.ogImageUrl;

    this.legalName = gallery.legalName;
    this.taxId = gallery.taxId;
    this.privacyPolicyUrl = gallery.privacyPolicyUrl;

    this.announcementText = gallery.announcementText;
    this.announcementUrl = gallery.announcementUrl;
    this.announcementEnabled = gallery.announcementEnabled;

    this.heroArtworkIds = gallery.heroArtworkIds;

    this.newsletterUrl = gallery.newsletterUrl;
    this.showPrices = gallery.showPrices;

    this.createdAt = gallery.createdAt;
    this.updatedAt = gallery.updatedAt;
  }
}

// Used by GET /api/galleries/:id — the owner-facing detail view, with the
// gallery's artist roster and full artwork list nested in. Takes already-
// built DTOs (rather than raw Prisma rows) since the service layer already
// has getArtistsByGallery/ArtworkDTO-building logic to reuse.
export class GalleryDetailDTO extends GalleryDTO {
  artists: ArtistSummaryDTO[];
  artworks: ArtworkDTO[];

  constructor(
    gallery: Gallery,
    artists: ArtistSummaryDTO[],
    artworks: ArtworkDTO[],
  ) {
    super(gallery);
    this.artists = artists;
    this.artworks = artworks;
  }
}
