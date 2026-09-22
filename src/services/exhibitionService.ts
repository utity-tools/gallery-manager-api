import prisma from "../db/prisma";
import { ExhibitionDTO } from "../dtos/ExhibitionDTO";
import {
  CreateExhibitionInput,
  UpdateExhibitionInput,
} from "../schemas/exhibition";
import { assertExhibitionOwnership } from "../utils/ownership";
import { PaginatedExhibitions } from "../types";

export async function getExhibitionsByArtist(
  artistId: string,
  page = 1,
  limit = 12,
): Promise<PaginatedExhibitions<ExhibitionDTO>> {
  const skip = (page - 1) * limit;

  const [exhibitions, total] = await Promise.all([
    prisma.exhibition.findMany({
      where: { artistId },
      skip,
      take: limit,
      orderBy: { year: "desc" },
    }),
    prisma.exhibition.count({ where: { artistId } }),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    exhibitions: exhibitions.map((e) => new ExhibitionDTO(e)),
    total,
    page,
    pages,
  };
}

export async function createExhibition(
  artistId: string,
  data: CreateExhibitionInput,
): Promise<ExhibitionDTO> {
  const exhibition = await prisma.exhibition.create({
    data: { artistId, ...data },
  });
  return new ExhibitionDTO(exhibition);
}

export async function updateExhibition(
  userId: string,
  exhibitionId: string,
  data: UpdateExhibitionInput,
): Promise<ExhibitionDTO> {
  await assertExhibitionOwnership(exhibitionId, userId);

  const exhibition = await prisma.exhibition.update({
    where: { id: exhibitionId },
    data,
  });

  return new ExhibitionDTO(exhibition);
}

export async function deleteExhibition(
  userId: string,
  exhibitionId: string,
): Promise<{ message: string }> {
  await assertExhibitionOwnership(exhibitionId, userId);

  await prisma.exhibition.delete({ where: { id: exhibitionId } });

  return { message: "Exhibition deleted" };
}
