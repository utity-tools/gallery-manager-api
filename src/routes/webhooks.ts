import { Router, Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import * as stripeService from "../services/stripeService";
import { success } from "../utils/response";

const router = Router();

// Raw body parser middleware (needed for Stripe signature verification)
export const rawBodyMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.is("application/json")) {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    next();
  }
};

// POST /webhooks/stripe
router.post("/stripe", async (req, res) => {
  const rawBody = (req as any).rawBody;
  const signature = req.headers["stripe-signature"] as string;

  if (!rawBody || !signature) {
    res.status(400).json({ error: "Missing body or signature" });
    return;
  }

  // Verify webhook signature
  const event = stripeService.verifyWebhookSignature(rawBody, signature);
  if (!event || !("type" in event)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  console.log(`[Webhook] Received Stripe event: ${event.type}`);

  try {
    // Handle different event types
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = (event as any).data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        // Update order status to "paid"
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid" },
        });

        console.log(`[Webhook] Order ${orderId} marked as paid`);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = (event as any).data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        // Update order status to "failed"
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "failed" },
        });

        console.log(`[Webhook] Order ${orderId} marked as failed`);
      }
    }

    // Return success to Stripe
    res.json(success({ received: true }));
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
