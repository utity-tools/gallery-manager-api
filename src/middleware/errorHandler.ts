import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, ERRORS } from "../errors/AppErrors";
import { ApiResponse, failure } from "../utils/response";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiResponse<never>>,
  _next: NextFunction,
): void {
  console.error("[ERROR]", err);

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    res
      .status(ERRORS.VALIDATION_ERROR.statusCode)
      .json(failure(ERRORS.VALIDATION_ERROR.code, messages.join(", ")));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(failure(err.code, err.message));
    return;
  }

  res
    .status(ERRORS.INTERNAL_ERROR.statusCode)
    .json(failure(ERRORS.INTERNAL_ERROR.code, ERRORS.INTERNAL_ERROR.message));
}

export function notFoundHandler(
  req: Request,
  res: Response<ApiResponse<never>>,
): void {
  res
    .status(ERRORS.NOT_FOUND.statusCode)
    .json(
      failure(
        ERRORS.NOT_FOUND.code,
        `Route ${req.method} ${req.originalUrl} not found`,
      ),
    );
}
