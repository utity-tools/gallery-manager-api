/**
 * One-off data migration (Phase B of the Artist entity rollout):
 * groups existing Artwork rows by (galleryId, artistName), creates an
 * Artist record for each unique pair, and backfills Artwork.artistId.
 *
 * Safe to re-run: skips artworks that already have an artistId, and reuses
 * an existing Artist row (same galleryId + slug) instead of duplicating it.
 *
 * Run with: npx tsx prisma/migrate-artists.ts
 */
import prisma from "../src/db/prisma";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "artist"
  );
}

async function main(): Promise<void> {
  const artworks = await prisma.artwork.findMany({
    where: { artistId: null },
    select: { id: true, galleryId: true, artistName: true },
  });

  console.log(`Found ${artworks.length} artwork(s) without artistId.`);

  const artistCache = new Map<string, string>(); // `${galleryId}::${name}` -> artistId

  for (const artwork of artworks) {
    const name = artwork.artistName?.trim() || "Unknown Artist";
    const cacheKey = `${artwork.galleryId}::${name}`;

    let artistId = artistCache.get(cacheKey);

    if (!artistId) {
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let suffix = 1;

      // Ensure slug uniqueness per gallery, same approach as user slugs.
      while (
        await prisma.artist.findUnique({
          where: { galleryId_slug: { galleryId: artwork.galleryId, slug } },
        })
      ) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      const artist = await prisma.artist.create({
        data: { galleryId: artwork.galleryId, name, slug },
      });

      artistId = artist.id;
      artistCache.set(cacheKey, artistId);
      console.log(`Created artist "${name}" (${artist.id}, slug=${slug}) in gallery ${artwork.galleryId}`);
    }

    await prisma.artwork.update({
      where: { id: artwork.id },
      data: { artistId },
    });
    console.log(`  -> linked artwork ${artwork.id} to artist ${artistId}`);
  }

  console.log("Data migration complete.");
}

main()
  .catch((err) => {
    console.error("Data migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
