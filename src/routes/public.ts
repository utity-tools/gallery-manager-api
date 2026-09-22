import { Router } from "express";
import * as galleryService from "../services/galleryService";
import * as artworkService from "../services/artworkService";
import * as artistService from "../services/artistService";
import * as showService from "../services/showService";
import { success } from "../utils/response";
import { parsePaginationParams } from "../utils/pagination";

const router = Router();

router.get("/galleries/:slug", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    res.json(success(gallery));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/artworks", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);

    const { page, limit, sortBy, order } = parsePaginationParams(req.query);
    const result = await artworkService.getArtworksByGallery(
      gallery.id,
      page,
      limit,
      sortBy,
      order,
    );

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/artists", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const artists = await artistService.getArtistsByGallery(gallery.id);
    res.json(success(artists));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/shows", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const shows = await showService.getShowsByGallery(gallery.id, {
      publicOnly: true,
    });
    res.json(success(shows));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/about", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const about = {
      aboutHeading: gallery.aboutHeading,
      aboutText: gallery.aboutText,
      aboutPhotoUrl: gallery.aboutPhotoUrl,
    };
    res.json(success(about));
  } catch (err) {
    next(err);
  }
});

export default router;
