import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as galleryService from "../services/galleryService";
import * as artworkService from "../services/artworkService";
import * as artistService from "../services/artistService";
import * as showService from "../services/showService";
import * as productService from "../services/productService";
import * as orderService from "../services/orderService";
import { UpdateGallerySchema } from "../schemas/gallery";
import { CreateArtworkSchema } from "../schemas/artwork";
import { CreateArtistSchema } from "../schemas/artist";
import { CreateShowSchema } from "../schemas/show";
import { CreateProductSchema, UpdateProductSchema } from "../schemas/product";
import { success } from "../utils/response";
import { parsePaginationParams } from "../utils/pagination";
import { assertGalleryOwnership } from "../utils/ownership";
import { z } from "zod";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const gallery = await galleryService.getUserGallery(req.user!.id);
    res.json(success(gallery));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const gallery = await galleryService.getGalleryDetail(req.params.id);
    res.json(success(gallery));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = UpdateGallerySchema.parse(req.body);
    const gallery = await galleryService.updateGallery(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(gallery));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/settings", requireAuth, async (req, res, next) => {
  try {
    const gallery = await galleryService.getUserGallery(req.user!.id);
    res.json(success(gallery));
  } catch (err) {
    next(err);
  }
});

router.get("/:galleryId/artworks", requireAuth, async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    await assertGalleryOwnership(galleryId, req.user!.id);

    const { page, limit, sortBy, order } = parsePaginationParams(req.query);
    const result = await artworkService.getArtworksByGallery(
      galleryId,
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

router.post("/:galleryId/artworks", requireAuth, async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    await assertGalleryOwnership(galleryId, req.user!.id);

    const data = CreateArtworkSchema.parse(req.body);
    const artwork = await artworkService.createArtwork(galleryId, data);

    res.status(201).json(success(artwork));
  } catch (err) {
    next(err);
  }
});

router.get("/:galleryId/artists", requireAuth, async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    await assertGalleryOwnership(galleryId, req.user!.id);

    const artists = await artistService.getArtistsByGallery(galleryId);

    res.json(success(artists));
  } catch (err) {
    next(err);
  }
});

router.post("/:galleryId/artists", requireAuth, async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    await assertGalleryOwnership(galleryId, req.user!.id);

    const data = CreateArtistSchema.parse(req.body);
    const artist = await artistService.createArtist(galleryId, data);

    res.status(201).json(success(artist));
  } catch (err) {
    next(err);
  }
});

// PRIVATE — owner only.
router.get("/:galleryId/shows", requireAuth, async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    await assertGalleryOwnership(galleryId, req.user!.id);

    const shows = await showService.getShowsByGallery(galleryId);

    res.json(success(shows));
  } catch (err) {
    next(err);
  }
});

// PRIVATE — owner only.
router.post("/:galleryId/shows", requireAuth, async (req, res, next) => {
  try {
    const { galleryId } = req.params;
    await assertGalleryOwnership(galleryId, req.user!.id);

    const data = CreateShowSchema.parse(req.body);
    const show = await showService.createShow(galleryId, data);

    res.status(201).json(success(show));
  } catch (err) {
    next(err);
  }
});

const UpdateAboutSchema = z.object({
  aboutHeading: z
    .string()
    .max(200, "aboutHeading must be 200 characters or fewer")
    .optional(),
  aboutText: z
    .string()
    .max(3000, "aboutText must be 3000 characters or fewer")
    .optional(),
  aboutPhotoUrl: z
    .string()
    .url("aboutPhotoUrl must be a valid URL")
    .optional(),
});

router.put("/:id/about", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const data = UpdateAboutSchema.parse(req.body);
    const gallery = await galleryService.updateGallery(
      req.user!.id,
      req.params.id,
      data,
    );
    res.json(success(gallery));
  } catch (err) {
    next(err);
  }
});

// eCommerce: Products CRUD (Private - owner only)
router.post("/:id/products", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const data = CreateProductSchema.parse(req.body);
    const product = await productService.createProduct(req.params.id, data);
    res.status(201).json(success(product));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/products", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const { page, limit } = parsePaginationParams(req.query);
    const result = await productService.getProductsByGallery(
      req.params.id,
      page,
      limit,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.put("/:id/products/:productId", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const data = UpdateProductSchema.parse(req.body);
    const product = await productService.updateProduct(
      req.params.id,
      req.params.productId,
      data,
    );
    res.json(success(product));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/products/:productId", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const result = await productService.deleteProduct(
      req.params.id,
      req.params.productId,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// eCommerce: Orders (Private - owner only)
router.get("/:id/orders", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const { page, limit } = parsePaginationParams(req.query);
    const result = await orderService.getOrdersByGallery(
      req.params.id,
      page,
      limit,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/orders/:orderId", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const order = await orderService.getOrderById(
      req.params.id,
      req.params.orderId,
    );
    res.json(success(order));
  } catch (err) {
    next(err);
  }
});

router.put("/:id/orders/:orderId", requireAuth, async (req, res, next) => {
  try {
    await assertGalleryOwnership(req.params.id, req.user!.id);
    const { orderStatus } = req.body;
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.params.orderId,
      orderStatus,
    );
    res.json(success(order));
  } catch (err) {
    next(err);
  }
});

export default router;
