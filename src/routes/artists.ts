import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as artistService from "../services/artistService";
import * as exhibitionService from "../services/exhibitionService";
import * as artFairService from "../services/artFairService";
import { UpdateArtistSchema } from "../schemas/artist";
import { CreateExhibitionSchema } from "../schemas/exhibition";
import { CreateArtFairSchema } from "../schemas/artfair";
import { success } from "../utils/response";
import { parsePaginationParams } from "../utils/pagination";
import { assertArtistOwnership } from "../utils/ownership";

const router = Router();

// Public: an artist's profile page on a gallery's public site.
router.get("/:id", async (req, res, next) => {
  try {
    const artist = await artistService.getArtistById(req.params.id);
    res.json(success(artist));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = UpdateArtistSchema.parse(req.body);
    const artist = await artistService.updateArtist(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(artist));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await artistService.deleteArtist(
      req.user!.id,
      req.params.id,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// Public: exhibition/art fair history shown on the artist's profile page.
router.get("/:id/exhibitions", async (req, res, next) => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const result = await exhibitionService.getExhibitionsByArtist(
      req.params.id,
      page,
      limit,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/exhibitions", requireAuth, async (req, res, next) => {
  try {
    await assertArtistOwnership(req.params.id, req.user!.id);

    const data = CreateExhibitionSchema.parse(req.body);
    const exhibition = await exhibitionService.createExhibition(
      req.params.id,
      data,
    );

    res.status(201).json(success(exhibition));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/artfairs", async (req, res, next) => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const result = await artFairService.getArtFairsByArtist(
      req.params.id,
      page,
      limit,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/artfairs", requireAuth, async (req, res, next) => {
  try {
    await assertArtistOwnership(req.params.id, req.user!.id);

    const data = CreateArtFairSchema.parse(req.body);
    const artFair = await artFairService.createArtFair(req.params.id, data);

    res.status(201).json(success(artFair));
  } catch (err) {
    next(err);
  }
});

export default router;
