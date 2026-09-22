import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as exhibitionService from "../services/exhibitionService";
import { UpdateExhibitionSchema } from "../schemas/exhibition";
import { success } from "../utils/response";

const router = Router();

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = UpdateExhibitionSchema.parse(req.body);
    const exhibition = await exhibitionService.updateExhibition(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(exhibition));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await exhibitionService.deleteExhibition(
      req.user!.id,
      req.params.id,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

export default router;
