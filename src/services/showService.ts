import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { ShowDTO, ShowSummaryDTO } from "../dtos/ShowDTO";
import { CreateShowInput, UpdateShowInput } from "../schemas/show";
import { generateUniqueSlug } from "../utils/slug";
import { assertShowOwnership } from "../utils/ownership";

const ARTIST_SELECT = { select: { id: true, name: true, slug: true } };

const DETAIL_ARTWORK_INCLUDE = {
  orderBy: { position: "asc" as const },
  include: { artwork: { include: { artist: ARTIST_SELECT } } },
};

async function assertArtistsBelongToGallery(
  artistIds: string[],
  galleryId: string,
): Promise<void> {
  if (artistIds.length === 0) {
    return;
  }

  const owned = await prisma.artist.findMany({
    where: { id: { in: artistIds }, galleryId },
    select: { id: true },
  });

  if (owned.length !== artistIds.length) {
    const ownedIds = new Set(owned.map((a) => a.id));
    const invalidIds = artistIds.filter((id) => !ownedIds.has(id));
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `artistIds contains artist(s) that don't belong to this gallery: ${invalidIds.join(", ")}`,
    });
  }
}

async function assertArtworksBelongToArtists(
  artworkIds: string[],
  artistIds: string[],
): Promise<void> {
  if (artworkIds.length === 0) {
    return;
  }

  const owned = await prisma.artwork.findMany({
    where: { id: { in: artworkIds }, artistId: { in: artistIds } },
    select: { id: true },
  });

  if (owned.length !== artworkIds.length) {
    const ownedIds = new Set(owned.map((a) => a.id));
    const invalidIds = artworkIds.filter((id) => !ownedIds.has(id));
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `artworkIds contains artwork(s) whose artist isn't part of this show: ${invalidIds.join(", ")}`,
    });
  }
}

async function loadShowDetail(showId: string): Promise<ShowDTO> {
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      artists: { include: { _count: { select: { artworks: true } } } },
      artworks: DETAIL_ARTWORK_INCLUDE,
    },
  });

  if (!show) {
    throw createError(ERRORS.SHOW_NOT_FOUND);
  }

  return new ShowDTO(
    show,
    show.artists,
    show.artworks.map((sa) => ({ artwork: sa.artwork, position: sa.position })),
  );
}

export async function getShowsByGallery(
  galleryId: string,
  options: { publicOnly?: boolean } = {},
): Promise<ShowSummaryDTO[]> {
  const shows = await prisma.show.findMany({
    where: { galleryId, ...(options.publicOnly ? { isPublic: true } : {}) },
    include: {
      artists: { select: { name: true } },
      _count: { select: { artworks: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return shows.map((show) => new ShowSummaryDTO(show));
}

// Internal — no isPublic gate. Safe for use right after create/update
// (owner-only flows) and anywhere ownership has already been checked.
export async function getShowById(showId: string): Promise<ShowDTO> {
  return loadShowDetail(showId);
}

// Used by GET /api/shows/:id (public, no auth) — 404s a draft show exactly
// like a private gallery, rather than leaking its existence/content.
export async function getPublicShowById(showId: string): Promise<ShowDTO> {
  const show = await loadShowDetail(showId);

  if (!show.isPublic) {
    throw createError(ERRORS.SHOW_NOT_FOUND);
  }

  return show;
}

export async function createShow(
  galleryId: string,
  data: CreateShowInput,
): Promise<ShowDTO> {
  const { artistIds = [], artworkIds = [], ...fields } = data;

  await assertArtistsBelongToGallery(artistIds, galleryId);
  await assertArtworksBelongToArtists(artworkIds, artistIds);

  const slug = await generateUniqueSlug(
    data.title,
    async (candidate) =>
      Boolean(
        await prisma.show.findUnique({
          where: { galleryId_slug: { galleryId, slug: candidate } },
        }),
      ),
    "show",
  );

  const show = await prisma.show.create({
    data: {
      galleryId,
      ...fields,
      slug,
      artists: { connect: artistIds.map((id) => ({ id })) },
    },
  });

  if (artworkIds.length > 0) {
    await prisma.showArtwork.createMany({
      data: artworkIds.map((artworkId, index) => ({
        showId: show.id,
        artworkId,
        position: index,
      })),
    });
  }

  return loadShowDetail(show.id);
}

export async function updateShow(
  userId: string,
  showId: string,
  data: UpdateShowInput,
): Promise<ShowDTO> {
  const show = await assertShowOwnership(showId, userId);

  const { artistIds, artworkIds, ...fields } = data;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(fields).length > 0) {
      await tx.show.update({ where: { id: showId }, data: fields });
    }

    if (artistIds !== undefined) {
      await assertArtistsBelongToGallery(artistIds, show.galleryId);

      await tx.show.update({
        where: { id: showId },
        data: { artists: { set: artistIds.map((id) => ({ id })) } },
      });

      // Confirmed behavior: removing an artist from a show auto-unlinks
      // their artworks from it too (no blocking, mirrors the Artist delete
      // cascade elsewhere in this project) — regardless of whether this
      // same request also touches artworkIds.
      await tx.showArtwork.deleteMany({
        where: { showId, artwork: { artistId: { notIn: artistIds } } },
      });
    }

    if (artworkIds !== undefined) {
      const effectiveArtistIds =
        artistIds ??
        (await tx.show.findUnique({
          where: { id: showId },
          include: { artists: true },
        }))!.artists.map((a) => a.id);

      await assertArtworksBelongToArtists(artworkIds, effectiveArtistIds);

      await tx.showArtwork.deleteMany({ where: { showId } });
      await tx.showArtwork.createMany({
        data: artworkIds.map((artworkId, index) => ({
          showId,
          artworkId,
          position: index,
        })),
      });
    }
  });

  return loadShowDetail(showId);
}

export async function deleteShow(
  userId: string,
  showId: string,
): Promise<{ message: string }> {
  await assertShowOwnership(showId, userId);

  // ShowArtwork rows cascade-delete via onDelete: Cascade in schema.prisma.
  await prisma.show.delete({ where: { id: showId } });

  return { message: "Show deleted" };
}
