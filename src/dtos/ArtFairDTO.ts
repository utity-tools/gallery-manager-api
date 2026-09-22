import { ArtFair } from "@prisma/client";

export class ArtFairDTO {
  id: string;
  artistId: string;
  name: string;
  country: string | null;
  year: number | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(artFair: ArtFair) {
    this.id = artFair.id;
    this.artistId = artFair.artistId;
    this.name = artFair.name;
    this.country = artFair.country;
    this.year = artFair.year;
    this.createdAt = artFair.createdAt;
    this.updatedAt = artFair.updatedAt;
  }
}
