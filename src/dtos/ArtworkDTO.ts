import { Artwork, Prisma } from "@prisma/client";

export interface ArtistRef {
  id: string;
  name: string;
  slug: string;
}

// Extended beyond the minimal sample shape (galleryId, createdAt, updatedAt
// added) so the previously-tested response payload doesn't lose fields.
// `artist` is populated when the source row was fetched with the artist
// relation included, so listings can show the artist's name without a
// separate round trip per artwork.
export class ArtworkDTO {
  id: string;
  galleryId: string;
  title: string;
  artistId: string;
  artist?: ArtistRef;
  year: number | null;
  description: string | null;
  price: Prisma.Decimal | null;
  imageUrl: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(artwork: Artwork & { artist?: ArtistRef }) {
    this.id = artwork.id;
    this.galleryId = artwork.galleryId;
    this.title = artwork.title;
    this.artistId = artwork.artistId;
    this.artist = artwork.artist;
    this.year = artwork.year;
    this.description = artwork.description;
    this.price = artwork.price;
    this.imageUrl = artwork.imageUrl;
    this.position = artwork.position;
    this.createdAt = artwork.createdAt;
    this.updatedAt = artwork.updatedAt;
  }
}
