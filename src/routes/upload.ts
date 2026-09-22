import { NextFunction, Request, Response, Router } from "express";
import multer, { MulterError } from "multer";
import { requireAuth } from "../middleware/auth";
import * as uploadService from "../services/uploadService";
import { createError, ERRORS } from "../errors/AppErrors";
import { success } from "../utils/response";

const router = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
}).single("file");

function parseFile(req: Request, res: Response, next: NextFunction): void {
  uploadSingleFile(req, res, (err: unknown) => {
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      next(createError(ERRORS.FILE_TOO_LARGE));
      return;
    }

    if (err) {
      const message = err instanceof Error ? err.message : "Invalid upload";
      next(createError(ERRORS.INVALID_FILE_TYPE, { message }));
      return;
    }

    next();
  });
}

router.post("/upload", requireAuth, parseFile, async (req, res, next) => {
  try {
    const { galleryId } = req.body as { galleryId?: string };
    const result = await uploadService.uploadImage(
      req.user!.id,
      galleryId,
      req.file,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

export default router;
