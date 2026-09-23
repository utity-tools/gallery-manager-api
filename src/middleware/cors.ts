import cors, { CorsOptions } from "cors";

// Allow localhost for development
const localOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
];

// Production/staging main domains
const productionOrigins = [
  "https://gallery-manager-web.vercel.app",
  "https://gallery-manager-api.vercel.app",
];

// Custom origins from environment
const customOrigins = process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : [];

const staticOrigins = [...localOrigins, ...productionOrigins, ...customOrigins];

// CORS origin validation function
// Allows:
// 1. Static list (localhost, production domains)
// 2. Vercel preview deployments (*.vercel.app)
// 3. Custom origins from env vars
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Check static list
    if (staticOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments (*.vercel.app pattern)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // Block origin
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export const corsMiddleware = cors(corsOptions);
