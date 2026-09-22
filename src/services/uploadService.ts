import { getSupabaseClient } from "../db/supabase";
import { assertGalleryOwnership } from "../utils/ownership";
import { createError, ERRORS } from "../errors/AppErrors";
import { UploadResponse } from "../types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET = "artworks";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function uploadImage(
  userId: string,
  galleryId: string | undefined,
  file: Express.Multer.File | undefined,
): Promise<UploadResponse> {
  if (!file) {
    throw createError(ERRORS.NO_FILE);
  }

  const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
  if (!ext) {
    throw createError(ERRORS.INVALID_FILE_TYPE, {
      message: "Only image files allowed (jpg, jpeg, png, gif, webp)",
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    throw createError(ERRORS.FILE_TOO_LARGE);
  }

  if (!galleryId) {
    throw createError(ERRORS.MISSING_GALLERY_ID);
  }

  await assertGalleryOwnership(galleryId, userId);

  const { v4: uuidv4 } = await import("uuid");
  const filename = `${uuidv4()}.${ext}`;
  const path = `${galleryId}/${filename}`;

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw createError(ERRORS.UPLOAD_FAILED, { message: error.message });
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { url: publicUrlData.publicUrl };
}
