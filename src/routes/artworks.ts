import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as artworkService from "../services/artworkService";
import { UpdateArtworkSchema } from "../schemas/artwork";
import { success } from "../utils/response";

const router = Router();

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = UpdateArtworkSchema.parse(req.body);
    const artwork = await artworkService.updateArtwork(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(artwork));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await artworkService.deleteArtwork(
      req.user!.id,
      req.params.id,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

export default router;
