import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";

export async function assertGalleryOwnership(
  galleryId: string,
  userId: string,
) {
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });

  if (!gallery) {
    throw createError(ERRORS.GALLERY_NOT_FOUND);
  }

  if (gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to access this gallery",
    });
  }

  return gallery;
}

export async function assertArtistOwnership(artistId: string, userId: string) {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { gallery: true },
  });

  if (!artist) {
    throw createError(ERRORS.ARTIST_NOT_FOUND);
  }

  if (artist.gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to access this artist",
    });
  }

  return artist;
}

export async function assertExhibitionOwnership(
  exhibitionId: string,
  userId: string,
) {
  const exhibition = await prisma.exhibition.findUnique({
    where: { id: exhibitionId },
    include: { artist: { include: { gallery: true } } },
  });

  if (!exhibition) {
    throw createError(ERRORS.EXHIBITION_NOT_FOUND);
  }

  if (exhibition.artist.gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to access this exhibition",
    });
  }

  return exhibition;
}

export async function assertShowOwnership(showId: string, userId: string) {
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: { gallery: true },
  });

  if (!show) {
    throw createError(ERRORS.SHOW_NOT_FOUND);
  }

  if (show.gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to access this show",
    });
  }

  return show;
}

export async function assertArtFairOwnership(
  artFairId: string,
  userId: string,
) {
  const artFair = await prisma.artFair.findUnique({
    where: { id: artFairId },
    include: { artist: { include: { gallery: true } } },
  });

  if (!artFair) {
    throw createError(ERRORS.ARTFAIR_NOT_FOUND);
  }

  if (artFair.artist.gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to access this art fair",
    });
  }

  return artFair;
}
