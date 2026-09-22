import prisma from "../db/prisma";
import { ArtFairDTO } from "../dtos/ArtFairDTO";
import { CreateArtFairInput, UpdateArtFairInput } from "../schemas/artfair";
import { assertArtFairOwnership } from "../utils/ownership";
import { PaginatedArtFairs } from "../types";

export async function getArtFairsByArtist(
  artistId: string,
  page = 1,
  limit = 12,
): Promise<PaginatedArtFairs<ArtFairDTO>> {
  const skip = (page - 1) * limit;

  const [artFairs, total] = await Promise.all([
    prisma.artFair.findMany({
      where: { artistId },
      skip,
      take: limit,
      orderBy: { year: "desc" },
    }),
    prisma.artFair.count({ where: { artistId } }),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    artFairs: artFairs.map((a) => new ArtFairDTO(a)),
    total,
    page,
    pages,
  };
}

export async function createArtFair(
  artistId: string,
  data: CreateArtFairInput,
): Promise<ArtFairDTO> {
  const artFair = await prisma.artFair.create({ data: { artistId, ...data } });
  return new ArtFairDTO(artFair);
}

export async function updateArtFair(
  userId: string,
  artFairId: string,
  data: UpdateArtFairInput,
): Promise<ArtFairDTO> {
  await assertArtFairOwnership(artFairId, userId);

  const artFair = await prisma.artFair.update({
    where: { id: artFairId },
    data,
  });

  return new ArtFairDTO(artFair);
}

export async function deleteArtFair(
  userId: string,
  artFairId: string,
): Promise<{ message: string }> {
  await assertArtFairOwnership(artFairId, userId);

  await prisma.artFair.delete({ where: { id: artFairId } });

  return { message: "Art fair deleted" };
}
