import { Artist, ArtFair, Artwork, Exhibition } from "@prisma/client";
import { ExhibitionDTO } from "./ExhibitionDTO";
import { ArtFairDTO } from "./ArtFairDTO";
import { ArtworkDTO } from "./ArtworkDTO";

// Used by GET /api/galleries/:id/artists — a light roster row, not the full
// detail payload.
export class ArtistSummaryDTO {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  birthYear: number | null;
  bio: string | null;
  photoUrl: string | null;
  artworkCount: number;

  constructor(artist: Artist & { _count: { artworks: number } }) {
    this.id = artist.id;
    this.name = artist.name;
    this.slug = artist.slug;
    this.country = artist.country;
    this.birthYear = artist.birthYear;
    this.bio = artist.bio;
    this.photoUrl = artist.photoUrl;
    this.artworkCount = artist._count.artworks;
  }
}

// Used by GET /api/artists/:id — full profile plus nested history, per
// "Artist con bio, exhibitions, artFairs, cv, artworks" in the spec.
export class ArtistDTO {
  id: string;
  galleryId: string;
  name: string;
  slug: string;
  country: string | null;
  birthYear: number | null;
  bio: string | null;
  photoUrl: string | null;
  cv: string | null;
  biographyPhotoUrl: string | null;
  biographyHeading: string | null;
  biographyText: string | null;
  createdAt: Date;
  updatedAt: Date;
  exhibitions: ExhibitionDTO[];
  artFairs: ArtFairDTO[];
  artworks: ArtworkDTO[];
  featuredArtworks: ArtworkDTO[];
  exhibitionCount: number;
  artfairCount: number;
  artworkCount: number;

  constructor(
    artist: Artist & {
      exhibitions: Exhibition[];
      artFairs: ArtFair[];
      artworks: Artwork[];
      featuredArtworks: Artwork[];
    },
  ) {
    this.id = artist.id;
    this.galleryId = artist.galleryId;
    this.name = artist.name;
    this.slug = artist.slug;
    this.country = artist.country;
    this.birthYear = artist.birthYear;
    this.bio = artist.bio;
    this.photoUrl = artist.photoUrl;
    this.cv = artist.cv;
    this.biographyPhotoUrl = artist.biographyPhotoUrl;
    this.biographyHeading = artist.biographyHeading;
    this.biographyText = artist.biographyText;
    this.createdAt = artist.createdAt;
    this.updatedAt = artist.updatedAt;
    this.exhibitions = artist.exhibitions.map((e) => new ExhibitionDTO(e));
    this.artFairs = artist.artFairs.map((a) => new ArtFairDTO(a));
    this.artworks = artist.artworks.map((a) => new ArtworkDTO(a));
    this.featuredArtworks = artist.featuredArtworks.map(
      (a) => new ArtworkDTO(a),
    );
    // These currently fetch the full (unpaginated) lists above, so .length
    // is accurate — if getArtistById ever paginates them, switch these to
    // real _count queries instead.
    this.exhibitionCount = this.exhibitions.length;
    this.artfairCount = this.artFairs.length;
    this.artworkCount = this.artworks.length;
  }
}
