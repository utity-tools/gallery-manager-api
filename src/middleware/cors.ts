import cors from "cors";

const frontendUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const corsMiddleware = cors({
  origin: frontendUrl,
  credentials: true,
});
