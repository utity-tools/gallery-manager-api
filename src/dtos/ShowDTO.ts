import { Show } from "@prisma/client";
import { ArtistSummaryDTO } from "./ArtistDTO";
import { ArtworkDTO } from "./ArtworkDTO";

export type ShowStatus = "upcoming" | "current" | "past";

// Computed at read time from startDate/endDate — never persisted, so it can
// never go stale. No dates set at all -> null (nothing to compare against).
function computeStatus(
  startDate: Date | null,
  endDate: Date | null,
): ShowStatus | null {
  if (!startDate && !endDate) {
    return null;
  }

  const now = new Date();

  if (startDate && now < startDate) {
    return "upcoming";
  }

  if (endDate && now > endDate) {
    return "past";
  }

  return "current";
}

class ShowBaseDTO {
  id: string;
  galleryId: string;
  title: string;
  slug: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  status: ShowStatus | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(show: Show) {
    this.id = show.id;
    this.galleryId = show.galleryId;
    this.title = show.title;
    this.slug = show.slug;
    this.description = show.description;
    this.startDate = show.startDate;
    this.endDate = show.endDate;
    this.venueName = show.venueName;
    this.address = show.address;
    this.city = show.city;
    this.country = show.country;
    this.coverImageUrl = show.coverImageUrl;
    this.isPublic = show.isPublic;
    this.status = computeStatus(show.startDate, show.endDate);
    this.createdAt = show.createdAt;
    this.updatedAt = show.updatedAt;
  }
}

// Used by list views (dashboard, calendar, public exhibitions page) — no
// nested artist/artwork detail, just enough to render a card.
export class ShowSummaryDTO extends ShowBaseDTO {
  artistNames: string[];
  artworkCount: number;

  constructor(
    show: Show & { artists: { name: string }[]; _count: { artworks: number } },
  ) {
    super(show);
    this.artistNames = show.artists.map((a) => a.name);
    this.artworkCount = show._count.artworks;
  }
}

// ArtworkDTO.position is the artwork's general portfolio position — not its
// place within this specific show. showPosition is the ShowArtwork.position
// value, exposed explicitly so the frontend has something to reorder by
// other than "trust the array order".
export class ShowArtworkDTO extends ArtworkDTO {
  showPosition: number;

  constructor(
    artwork: ConstructorParameters<typeof ArtworkDTO>[0],
    showPosition: number,
  ) {
    super(artwork);
    this.showPosition = showPosition;
  }
}

// Used by GET /api/shows/:id — full detail with the participating artist
// roster and the curated, ordered artwork list.
export class ShowDTO extends ShowBaseDTO {
  artists: ArtistSummaryDTO[];
  artworks: ShowArtworkDTO[];

  constructor(
    show: Show,
    artists: ConstructorParameters<typeof ArtistSummaryDTO>[0][],
    artworks: {
      artwork: ConstructorParameters<typeof ArtworkDTO>[0];
      position: number;
    }[],
  ) {
    super(show);
    this.artists = artists.map((a) => new ArtistSummaryDTO(a));
    this.artworks = artworks.map(
      ({ artwork, position }) => new ShowArtworkDTO(artwork, position),
    );
  }
}
