import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { ArtworkDTO } from "../dtos/ArtworkDTO";
import { CreateArtworkInput, UpdateArtworkInput } from "../schemas/artwork";
import { PaginatedResponse } from "../types";

const SORTABLE_FIELDS = ["createdAt", "price", "year", "title"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

const SORT_ORDERS = ["asc", "desc"] as const;
type SortOrder = (typeof SORT_ORDERS)[number];

const ARTIST_SELECT = { select: { id: true, name: true, slug: true } };

function isSortableField(value: string): value is SortableField {
  return (SORTABLE_FIELDS as readonly string[]).includes(value);
}

function isSortOrder(value: string): value is SortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value);
}

async function assertArtistBelongsToGallery(
  artistId: string,
  galleryId: string,
): Promise<void> {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });

  if (!artist) {
    throw createError(ERRORS.ARTIST_NOT_FOUND);
  }

  if (artist.galleryId !== galleryId) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: "artistId does not belong to this gallery",
    });
  }
}

export async function getArtworksByGallery(
  galleryId: string,
  page = 1,
  limit = 12,
  sortBy = "createdAt",
  order = "desc",
): Promise<PaginatedResponse<ArtworkDTO>> {
  if (!isSortableField(sortBy)) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `Invalid sortBy field: ${sortBy}. Must be one of ${SORTABLE_FIELDS.join(", ")}`,
    });
  }

  if (!isSortOrder(order)) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `Invalid order: ${order}. Must be 'asc' or 'desc'`,
    });
  }

  const skip = (page - 1) * limit;
  const orderBy: Prisma.ArtworkOrderByWithRelationInput = { [sortBy]: order };

  const [artworks, total] = await Promise.all([
    prisma.artwork.findMany({
      where: { galleryId },
      skip,
      take: limit,
      orderBy,
      include: { artist: ARTIST_SELECT },
    }),
    prisma.artwork.count({ where: { galleryId } }),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    artworks: artworks.map((artwork) => new ArtworkDTO(artwork)),
    total,
    page,
    pages,
  };
}

export async function createArtwork(
  galleryId: string,
  data: CreateArtworkInput,
): Promise<ArtworkDTO> {
  await assertArtistBelongsToGallery(data.artistId, galleryId);

  const maxPos = await prisma.artwork.findFirst({
    where: { galleryId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = (maxPos?.position ?? 0) + 1;

  const artwork = await prisma.artwork.create({
    data: {
      galleryId,
      title: data.title,
      artistId: data.artistId,
      description: data.description,
      imageUrl: data.imageUrl,
      price: data.price,
      year: data.year,
      position,
    },
    include: { artist: ARTIST_SELECT },
  });

  return new ArtworkDTO(artwork);
}

export async function updateArtwork(
  userId: string,
  artworkId: string,
  data: UpdateArtworkInput,
): Promise<ArtworkDTO> {
  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });

  if (!artwork) {
    throw createError(ERRORS.ARTWORK_NOT_FOUND);
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: artwork.galleryId },
  });

  if (!gallery || gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to update this artwork",
    });
  }

  if (data.artistId) {
    await assertArtistBelongsToGallery(data.artistId, artwork.galleryId);
  }

  const updated = await prisma.artwork.update({
    where: { id: artworkId },
    data,
    include: { artist: ARTIST_SELECT },
  });

  return new ArtworkDTO(updated);
}

export async function deleteArtwork(
  userId: string,
  artworkId: string,
): Promise<{ message: string }> {
  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });

  if (!artwork) {
    throw createError(ERRORS.ARTWORK_NOT_FOUND);
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: artwork.galleryId },
  });

  if (!gallery || gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to delete this artwork",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.artwork.delete({ where: { id: artworkId } });

    const remaining = await tx.artwork.findMany({
      where: { galleryId: artwork.galleryId },
      orderBy: { position: "asc" },
    });

    await Promise.all(
      remaining.map((item, index) =>
        tx.artwork.update({
          where: { id: item.id },
          data: { position: index + 1 },
        }),
      ),
    );

    // Cascade: remove artwork from heroArtworkIds if present
    await tx.gallery.update({
      where: { id: artwork.galleryId },
      data: {
        heroArtworkIds: {
          set: gallery.heroArtworkIds.filter((id) => id !== artworkId),
        },
      },
    });
  });

  return { message: "Artwork deleted" };
}
