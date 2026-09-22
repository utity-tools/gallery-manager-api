import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createError, ERRORS } from "../errors/AppErrors";
import { JWTPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token: string): JWTPayload {
  if (!JWT_SECRET) {
    throw createError(ERRORS.INTERNAL_ERROR, {
      message: "JWT_SECRET is not configured",
    });
  }

  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw createError(ERRORS.UNAUTHENTICATED, {
      message: "Invalid or expired token",
    });
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    next(
      createError(ERRORS.UNAUTHENTICATED, {
        message: "Missing authentication token",
      }),
    );
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
