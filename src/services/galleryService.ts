import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { GalleryDTO, GalleryDetailDTO } from "../dtos/GalleryDTO";
import { ArtworkDTO } from "../dtos/ArtworkDTO";
import { UpdateGalleryInput } from "../schemas/gallery";
import * as artistService from "./artistService";
import { getSupabaseClient } from "../db/supabase";

export async function getUserGallery(userId: string): Promise<GalleryDTO> {
  const gallery = await prisma.gallery.findUnique({ where: { userId } });

  if (!gallery) {
    throw createError(ERRORS.GALLERY_NOT_FOUND);
  }

  return new GalleryDTO(gallery);
}

export async function getGalleryDetail(
  galleryId: string,
): Promise<GalleryDetailDTO> {
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });

  if (!gallery) {
    throw createError(ERRORS.GALLERY_NOT_FOUND);
  }

  const [artists, artworks] = await Promise.all([
    artistService.getArtistsByGallery(galleryId),
    prisma.artwork.findMany({
      where: { galleryId },
      orderBy: { position: "asc" },
      include: { artist: { select: { id: true, name: true, slug: true } } },
    }),
  ]);

  return new GalleryDetailDTO(
    gallery,
    artists,
    artworks.map((artwork) => new ArtworkDTO(artwork)),
  );
}

function extractPathFromSupabaseUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/artworks\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function updateGallery(
  userId: string,
  galleryId: string,
  data: UpdateGalleryInput,
): Promise<GalleryDTO> {
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });

  if (!gallery) {
    throw createError(ERRORS.GALLERY_NOT_FOUND);
  }

  if (gallery.userId !== userId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to update this gallery",
    });
  }

  // Validate heroArtworkIds if provided
  if (data.heroArtworkIds !== undefined) {
    if (data.heroArtworkIds && data.heroArtworkIds.length > 0) {
      const existingArtworks = await prisma.artwork.findMany({
        where: { id: { in: data.heroArtworkIds }, galleryId },
        select: { id: true },
      });

      const existingIds = new Set(existingArtworks.map((a) => a.id));
      const invalidIds = data.heroArtworkIds.filter(
        (id) => !existingIds.has(id),
      );

      if (invalidIds.length > 0) {
        throw createError(ERRORS.VALIDATION_ERROR, {
          message: `heroArtworkIds contains invalid or non-existent artwork(s): ${invalidIds.join(", ")}`,
        });
      }
    }
  }

  // Delete old logo if a new one is being set
  if (data.logoUrl && gallery.logoUrl && data.logoUrl !== gallery.logoUrl) {
    const oldPath = extractPathFromSupabaseUrl(gallery.logoUrl);
    if (oldPath) {
      const supabase = getSupabaseClient();
      await supabase.storage.from("artworks").remove([oldPath]);
    }
  }

  // Delete old dark logo if a new one is being set
  if (
    data.logoDarkUrl &&
    gallery.logoDarkUrl &&
    data.logoDarkUrl !== gallery.logoDarkUrl
  ) {
    const oldPath = extractPathFromSupabaseUrl(gallery.logoDarkUrl);
    if (oldPath) {
      const supabase = getSupabaseClient();
      await supabase.storage.from("artworks").remove([oldPath]);
    }
  }

  const updated = await prisma.gallery.update({
    where: { id: galleryId },
    data,
  });

  return new GalleryDTO(updated);
}

export async function getGalleryBySlug(slug: string): Promise<GalleryDTO> {
  const user = await prisma.user.findUnique({ where: { slug } });

  if (!user) {
    throw createError(ERRORS.GALLERY_NOT_FOUND);
  }

  const gallery = await prisma.gallery.findUnique({
    where: { userId: user.id },
  });

  if (!gallery || !gallery.isPublic) {
    throw createError(ERRORS.GALLERY_NOT_FOUND);
  }

  return new GalleryDTO(gallery);
}
