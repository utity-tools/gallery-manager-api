import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { OrderDTO } from "../dtos/OrderDTO";
import { CheckoutInput } from "../schemas/product";
import { checkStockAvailable } from "./productService";
import { PaginatedResponse } from "../types";

export async function createOrder(
  galleryId: string,
  data: CheckoutInput,
): Promise<{ orderId: string; clientSecret?: string; totalPrice: number }> {
  // Validate all products exist and belong to gallery + check stock
  const products = await prisma.product.findMany({
    where: {
      id: { in: data.items.map((item) => item.productId) },
      galleryId,
    },
  });

  if (products.length !== data.items.length) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: "One or more products not found or do not belong to this gallery",
    });
  }

  // Check stock for all items
  for (const item of data.items) {
    const hasStock = await checkStockAvailable(item.productId, item.quantity);
    if (!hasStock) {
      const product = products.find((p) => p.id === item.productId);
      throw createError(ERRORS.VALIDATION_ERROR, {
        message: `Insufficient stock for product: ${product?.title}`,
      });
    }
  }

  // Calculate total price
  let totalPrice = 0;
  const orderItems: Array<{
    productId: string;
    quantity: number;
    priceAtTime: any;
    variantes: any;
  }> = [];

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    const itemTotal = Number(product.price) * item.quantity;
    totalPrice += itemTotal;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: product.price,
      variantes: item.variantes || null,
    });
  }

  // Create order in transaction (create order + decrement stock)
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        galleryId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        totalPrice,
        shippingAddress: data.shippingAddress as any,
        paymentStatus: "pending",
        orderStatus: "new",
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Decrement stock for each product
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return newOrder;
  });

  return {
    orderId: order.id,
    totalPrice,
    // clientSecret will be set by Stripe integration
  };
}

export async function getOrdersByGallery(
  galleryId: string,
  page = 1,
  limit = 12,
): Promise<PaginatedResponse<OrderDTO>> {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { galleryId },
      skip,
      take: limit,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where: { galleryId } }),
  ]);

  return {
    items: orders.map((order) => new OrderDTO(order)),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getOrderById(
  galleryId: string,
  orderId: string,
): Promise<OrderDTO> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.galleryId !== galleryId) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: "Order not found",
    });
  }

  return new OrderDTO(order);
}

export async function updateOrderStatus(
  galleryId: string,
  orderId: string,
  newStatus: string,
): Promise<OrderDTO> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.galleryId !== galleryId) {
    throw createError(ERRORS.FORBIDDEN, {
      message: "You do not have permission to update this order",
    });
  }

  const validStatuses = ["new", "processing", "shipped", "delivered"];
  if (!validStatuses.includes(newStatus)) {
    throw createError(ERRORS.VALIDATION_ERROR, {
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: newStatus },
    include: { items: true },
  });

  return new OrderDTO(updated);
}
