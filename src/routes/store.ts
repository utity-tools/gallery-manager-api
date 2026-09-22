import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as galleryService from "../services/galleryService";
import * as productService from "../services/productService";
import * as orderService from "../services/orderService";
import { success } from "../utils/response";
import { parsePaginationParams } from "../utils/pagination";
import { CheckoutSchema } from "../schemas/product";

const router = Router();

// Rate limiter for checkout (5 req/15min per IP, prevent fraud)
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 checkout attempts per windowMs
  skipSuccessfulRequests: false,
  message: "Too many checkout attempts, please try again later.",
});

// GET /api/public/galleries/:slug/store
router.get("/galleries/:slug/store", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const { page, limit } = parsePaginationParams(req.query);
    const category = typeof req.query.category === "string" ? req.query.category : undefined;

    let result = await productService.getProductsByGallery(gallery.id, page, limit);

    // Filter by category if provided
    if (category) {
      const filtered = result.artworks.filter((p) => p.category === category);
      result = {
        ...result,
        artworks: filtered,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      };
    }

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// GET /api/public/galleries/:slug/store/:productId
router.get("/galleries/:slug/store/:productId", async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryBySlug(req.params.slug);
    const product = await productService.getProductById(req.params.productId);

    if (product.galleryId !== gallery.id) {
      throw new Error("Product does not belong to this gallery");
    }

    res.json(success(product));
  } catch (err) {
    next(err);
  }
});

// POST /api/public/galleries/:slug/store/checkout
router.post(
  "/galleries/:slug/store/checkout",
  checkoutLimiter,
  async (req, res, next) => {
    try {
      const gallery = await galleryService.getGalleryBySlug(req.params.slug);
      const data = CheckoutSchema.parse(req.body);

      const result = await orderService.createOrder(gallery.id, data);

      res.status(201).json(success(result));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
