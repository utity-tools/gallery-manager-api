import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import prisma from "./db/prisma";
import authRoutes from "./routes/auth";
import galleryRoutes from "./routes/galleries";
import artworkRoutes from "./routes/artworks";
import artistRoutes from "./routes/artists";
import exhibitionRoutes from "./routes/exhibitions";
import artFairRoutes from "./routes/artfairs";
import showRoutes from "./routes/shows";
import publicRoutes from "./routes/public";
import uploadRoutes from "./routes/upload";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  skipSuccessfulRequests: true, // don't count successful requests
  message: "Too many login attempts, please try again later.",
});

app.use(globalLimiter);

// CORS and JSON
app.use(corsMiddleware);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB check timeout")), 5000),
      ),
    ]);
    res.json({
      status: "ok",
      db: true,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      db: false,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/galleries", galleryRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/exhibitions", exhibitionRoutes);
app.use("/api/artfairs", artFairRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function main(): Promise<void> {
  await prisma.$connect();

  const server = app.listen(PORT, () => {
    console.log(`Gallery Manager API listening on port ${PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
