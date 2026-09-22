-- AlterTable
ALTER TABLE "Artwork" DROP COLUMN "artistName",
ALTER COLUMN "artistId" SET NOT NULL;
