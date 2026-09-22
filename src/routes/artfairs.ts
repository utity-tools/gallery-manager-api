import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as artFairService from "../services/artFairService";
import { UpdateArtFairSchema } from "../schemas/artfair";
import { success } from "../utils/response";

const router = Router();

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = UpdateArtFairSchema.parse(req.body);
    const artFair = await artFairService.updateArtFair(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(artFair));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await artFairService.deleteArtFair(
      req.user!.id,
      req.params.id,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

export default router;
