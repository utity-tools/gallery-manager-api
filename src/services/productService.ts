import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { ProductDTO } from "../dtos/ProductDTO";
import { CreateProductInput, UpdateProductInput } from "../schemas/product";
import { PaginatedResponse } from "../types";

export async function createProduct(
  galleryId: string,
  data: CreateProductInput,
): Promise<ProductDTO> {
  // Verify SKU is unique per gallery
  const existing = await prisma.product.findUnique({
    where: { galleryId_sku: { galleryId, sku: data.sku } },
  });

  if (existing) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `SKU '${data.sku}' already exists in this gallery`,
    });
  }

  const product = await prisma.product.create({
    data: {
      galleryId,
      ...data,
    },
  });

  return new ProductDTO(product);
}

export async function getProductsByGallery(
  galleryId: string,
  page = 1,
  limit = 12,
): Promise<PaginatedResponse<ProductDTO>> {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { galleryId, isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where: { galleryId, isActive: true } }),
  ]);

  return {
    products: products.map((product) => new ProductDTO(product)),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getProductById(productId: string): Promise<ProductDTO> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: "Product not found",
    });
  }

  return new ProductDTO(product);
}

export async function updateProduct(
  galleryId: string,
  productId: string,
  data: UpdateProductInput,
): Promise<ProductDTO> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.galleryId !== galleryId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to update this product",
    });
  }

  // Check SKU uniqueness if changing
  if (data.sku && data.sku !== product.sku) {
    const existing = await prisma.product.findUnique({
      where: { galleryId_sku: { galleryId, sku: data.sku } },
    });

    if (existing) {
      throw createError(ERRORS.VALIDATION_ERROR, {
        message: `SKU '${data.sku}' already exists in this gallery`,
      });
    }
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
  });

  return new ProductDTO(updated);
}

export async function deleteProduct(
  galleryId: string,
  productId: string,
): Promise<{ message: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.galleryId !== galleryId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to delete this product",
    });
  }

  await prisma.product.delete({ where: { id: productId } });

  return { message: "Product deleted" };
}

export async function checkStockAvailable(
  productId: string,
  quantity: number,
): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  return product ? product.stock >= quantity : false;
}
