import Stripe from "stripe";
import { createError, ERRORS } from "../errors/AppErrors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-08-26.dahlia" as any,
});

export interface PaymentIntentInput {
  orderId: string;
  amount: number; // in cents (e.g., 2999 for €29.99)
  customerEmail: string;
  customerName: string;
  galleryId: string;
}

export async function createPaymentIntent(
  data: PaymentIntentInput,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw createError(ERRORS.INTERNAL_ERROR, {
      message: "Stripe is not configured",
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: "eur",
      description: `Order ${data.orderId} from ${data.galleryId}`,
      receipt_email: data.customerEmail,
      metadata: {
        orderId: data.orderId,
        galleryId: data.galleryId,
        customerName: data.customerName,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret || "",
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("[Stripe] Error creating PaymentIntent:", error);
    throw createError(ERRORS.INTERNAL_ERROR, {
      message: "Failed to create payment intent",
    });
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
): Promise<{ status: string; amount: number }> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back to euros
    };
  } catch (error) {
    console.error("[Stripe] Error confirming PaymentIntent:", error);
    throw createError(ERRORS.INTERNAL_ERROR, {
      message: "Failed to confirm payment",
    });
  }
}

export function verifyWebhookSignature(
  body: Buffer | string,
  signature: string,
): object | null {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe] Webhook secret not configured");
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    return event;
  } catch (error) {
    console.error("[Stripe] Webhook signature verification failed:", error);
    return null;
  }
}

export async function handlePaymentIntentSucceeded(
  paymentIntentId: string,
): Promise<{ orderId: string; status: string }> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      throw new Error("Order ID not found in payment intent metadata");
    }

    return {
      orderId,
      status: "paid",
    };
  } catch (error) {
    console.error("[Stripe] Error handling payment success:", error);
    throw error;
  }
}
