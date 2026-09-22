import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { ArtistDTO, ArtistSummaryDTO } from "../dtos/ArtistDTO";
import { CreateArtistInput, UpdateArtistInput } from "../schemas/artist";
import { generateUniqueSlug } from "../utils/slug";
import { assertArtistOwnership } from "../utils/ownership";

const DETAIL_INCLUDE = {
  exhibitions: { orderBy: { year: "desc" as const } },
  artFairs: { orderBy: { year: "desc" as const } },
  artworks: { orderBy: { position: "asc" as const } },
  featuredArtworks: { orderBy: { position: "asc" as const } },
};

export async function getArtistsByGallery(
  galleryId: string,
): Promise<ArtistSummaryDTO[]> {
  const artists = await prisma.artist.findMany({
    where: { galleryId },
    include: { _count: { select: { artworks: true } } },
    orderBy: { name: "asc" },
  });

  return artists.map((artist) => new ArtistSummaryDTO(artist));
}

export async function getArtistById(artistId: string): Promise<ArtistDTO> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: DETAIL_INCLUDE,
  });

  if (!artist) {
    throw createError(ERRORS.ARTIST_NOT_FOUND);
  }

  return new ArtistDTO(artist);
}

export async function createArtist(
  galleryId: string,
  data: CreateArtistInput,
): Promise<ArtistDTO> {
  const slug = await generateUniqueSlug(
    data.name,
    async (candidate) =>
      Boolean(
        await prisma.artist.findUnique({
          where: { galleryId_slug: { galleryId, slug: candidate } },
        }),
      ),
    "artist",
  );

  const artist = await prisma.artist.create({
    data: { galleryId, ...data, slug },
  });

  return new ArtistDTO({
    ...artist,
    exhibitions: [],
    artFairs: [],
    artworks: [],
    featuredArtworks: [],
  });
}

async function assertArtworksBelongToArtist(
  artworkIds: string[],
  artistId: string,
): Promise<void> {
  if (artworkIds.length === 0) {
    return;
  }

  const owned = await prisma.artwork.findMany({
    where: { id: { in: artworkIds }, artistId },
    select: { id: true },
  });

  if (owned.length !== artworkIds.length) {
    const ownedIds = new Set(owned.map((a) => a.id));
    const invalidIds = artworkIds.filter((id) => !ownedIds.has(id));
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `featuredArtworkIds contains artwork(s) that don't belong to this artist: ${invalidIds.join(", ")}`,
    });
  }
}

export async function updateArtist(
  userId: string,
  artistId: string,
  data: UpdateArtistInput,
): Promise<ArtistDTO> {
  await assertArtistOwnership(artistId, userId);

  const { featuredArtworkIds, ...fields } = data;

  if (featuredArtworkIds !== undefined) {
    await assertArtworksBelongToArtist(featuredArtworkIds, artistId);
  }

  const artist = await prisma.artist.update({
    where: { id: artistId },
    data: {
      ...fields,
      // `set` replaces the entire featured set in one go: connects the
      // given artworks and disconnects (featuredByArtistId -> null) any
      // previously-featured artwork not in the new list.
      ...(featuredArtworkIds !== undefined
        ? {
            featuredArtworks: { set: featuredArtworkIds.map((id) => ({ id })) },
          }
        : {}),
    },
    include: DETAIL_INCLUDE,
  });

  return new ArtistDTO(artist);
}

export async function deleteArtist(
  userId: string,
  artistId: string,
): Promise<{
  message: string;
  deletedCounts: { artworks: number; exhibitions: number; artFairs: number };
}> {
  await assertArtistOwnership(artistId, userId);

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: {
      _count: { select: { artworks: true, exhibitions: true, artFairs: true } },
    },
  });

  // assertArtistOwnership above already confirmed the artist exists, so this
  // can only be null under a race (deleted between the two calls).
  const deletedCounts = artist?._count ?? {
    artworks: 0,
    exhibitions: 0,
    artFairs: 0,
  };

  // Cascades: deletes this artist's artworks, exhibitions, and art fairs too
  // (onDelete: Cascade on all three relations in schema.prisma).
  await prisma.artist.delete({ where: { id: artistId } });

  if (
    deletedCounts.artworks > 0 ||
    deletedCounts.exhibitions > 0 ||
    deletedCounts.artFairs > 0
  ) {
    console.warn(
      `Artist ${artistId} deleted — cascaded ${deletedCounts.artworks} artwork(s), ` +
        `${deletedCounts.exhibitions} exhibition(s), ${deletedCounts.artFairs} art fair(s).`,
    );
  }

  return { message: "Artist deleted", deletedCounts };
}
