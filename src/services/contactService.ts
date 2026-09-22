import { CreateContactMessageInput } from "../schemas/contact";

export async function sendContactMessage(
  galleryId: string,
  data: CreateContactMessageInput,
): Promise<{ success: true; message: string }> {
  // Validate input
  if (!galleryId || !data.name || !data.email || !data.message) {
    throw new Error("Missing required fields");
  }

  // TODO: Integrate email service (Resend, SendGrid, etc)
  // For now: log the message and return success
  console.log(`[CONTACT] Gallery ${galleryId}:`, {
    from: data.email,
    name: data.name,
    subject: data.subject || "Contact Form Submission",
    message: data.message,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Your message has been sent successfully",
  };
}
