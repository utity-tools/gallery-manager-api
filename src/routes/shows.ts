import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as showService from "../services/showService";
import { UpdateShowSchema } from "../schemas/show";
import { success } from "../utils/response";

const router = Router();

// PUBLIC — no auth. Used by the public exhibition detail page.
router.get("/:id", async (req, res, next) => {
  try {
    const show = await showService.getPublicShowById(req.params.id);
    res.json(success(show));
  } catch (err) {
    next(err);
  }
});

// PRIVATE — owner only.
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = UpdateShowSchema.parse(req.body);
    const show = await showService.updateShow(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(show));
  } catch (err) {
    next(err);
  }
});

// PRIVATE — owner only.
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await showService.deleteShow(req.user!.id, req.params.id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

export default router;
