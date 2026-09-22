-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "biographyHeading" TEXT,
ADD COLUMN     "biographyPhotoUrl" TEXT,
ADD COLUMN     "biographyText" TEXT;

-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "featuredByArtistId" TEXT;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_featuredByArtistId_fkey" FOREIGN KEY ("featuredByArtistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
