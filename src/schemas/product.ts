import { z } from "zod";

export const CreateProductSchema = z.object({
  title: z
    .string()
    .min(1, "title is required")
    .max(200, "title must be 200 characters or fewer"),
  description: z
    .string()
    .max(1000, "description must be 1000 characters or fewer")
    .optional(),
  imageUrl: z.string().url("imageUrl must be a valid URL"),
  price: z
    .number()
    .positive("price must be a positive number")
    .max(99999.99, "price cannot exceed 99999.99"),
  category: z.enum(["print", "photo", "illustration", "merchandise"]),
  stock: z.number().int().nonnegative("stock cannot be negative"),
  sku: z.string().min(1, "sku is required").max(100),
  variantes: z
    .record(z.array(z.string()))
    .optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const CheckoutSchema = z.object({
  customerName: z
    .string()
    .min(1, "name is required")
    .max(100, "name must be 100 characters or fewer"),
  customerEmail: z.string().email("email must be a valid email address"),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      variantes: z.record(z.string()).optional(),
    }),
  ),
  shippingAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
