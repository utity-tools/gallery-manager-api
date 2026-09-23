import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as galleryService from "../services/galleryService";
import * as artworkService from "../services/artworkService";
import * as artistService from "../services/artistService";
import * as showService from "../services/showService";
import * as productService from "../services/productService";
import * as contactService from "../services/contactService";
import { success } from "../utils/response";
import { parsePaginationParams } from "../utils/pagination";
import { CreateContactMessageSchema } from "../schemas/contact";
import { createError, ERRORS } from "../errors/AppErrors";

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

router.get("/galleries/:slug/artworks/:artworkId", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const artwork = await artworkService.getArtworkById(req.params.artworkId);

    if (artwork.galleryId !== gallery.id) {
      throw new Error("Artwork does not belong to this gallery");
    }

    res.json(success(artwork));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/artists", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const { page, limit } = parsePaginationParams(req.query);
    const result = await artistService.getPublicArtistsByGallery(
      gallery.id,
      page,
      limit,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/artists/:artistSlug", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const artist = await artistService.getPublicArtistBySlug(
      gallery.id,
      req.params.artistSlug,
    );
    res.json(success(artist));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/shows", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const { page, limit } = parsePaginationParams(req.query);
    const result = await showService.getShowsByGallery(gallery.id, page, limit, {
      publicOnly: true,
    });
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/store", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const { page, limit } = parsePaginationParams(req.query);
    const result = await productService.getProductsByGallery(gallery.id, page, limit);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get("/galleries/:slug/store/:productId", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const product = await productService.getProductById(req.params.productId);

    if (product.galleryId !== gallery.id) {
      throw createError(ERRORS.FORBIDDEN, {
        message: "Product does not belong to this gallery",
      });
    }

    res.json(success(product));
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

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 contact submissions per windowMs
  skipSuccessfulRequests: false, // count all requests (including failures)
  message: "Too many contact form submissions, please try again later.",
});

router.post(
  "/galleries/:slug/contact",
  contactLimiter,
  async (req, res, next) => {
    try {
      const gallery = await galleryService.getGalleryBySlug(req.params.slug);
      const data = CreateContactMessageSchema.parse(req.body);
      const result = await contactService.sendContactMessage(gallery.id, data);
      res.status(201).json(success(result));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
