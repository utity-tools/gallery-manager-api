import { Exhibition } from "@prisma/client";

export class ExhibitionDTO {
  id: string;
  artistId: string;
  title: string;
  venue: string | null;
  country: string | null;
  year: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(exhibition: Exhibition) {
    this.id = exhibition.id;
    this.artistId = exhibition.artistId;
    this.title = exhibition.title;
    this.venue = exhibition.venue;
    this.country = exhibition.country;
    this.year = exhibition.year;
    this.description = exhibition.description;
    this.createdAt = exhibition.createdAt;
    this.updatedAt = exhibition.updatedAt;
  }
}
