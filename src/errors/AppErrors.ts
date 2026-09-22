export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface ErrorDef {
  code: string;
  statusCode: number;
  message: string;
}

export const ERRORS = {
  INVALID_CREDENTIALS: {
    code: "INVALID_CREDENTIALS",
    statusCode: 401,
    message: "Invalid email or password",
  },
  USER_EXISTS: {
    code: "USER_EXISTS",
    statusCode: 409,
    message: "User already exists",
  },
  UNAUTHENTICATED: {
    code: "UNAUTHENTICATED",
    statusCode: 401,
    message: "Authentication required",
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    statusCode: 403,
    message: "You do not have permission",
  },
  NO_FILE: { code: "NO_FILE", statusCode: 400, message: "No file provided" },
  INVALID_FILE_TYPE: {
    code: "INVALID_FILE_TYPE",
    statusCode: 400,
    message: "Only image files allowed",
  },
  FILE_TOO_LARGE: {
    code: "FILE_TOO_LARGE",
    statusCode: 413,
    message: "File too large (max 10MB)",
  },
  MISSING_GALLERY_ID: {
    code: "MISSING_GALLERY_ID",
    statusCode: 400,
    message: "galleryId required",
  },
  UPLOAD_FAILED: {
    code: "UPLOAD_FAILED",
    statusCode: 500,
    message: "Upload failed",
  },
  GALLERY_NOT_FOUND: {
    code: "GALLERY_NOT_FOUND",
    statusCode: 404,
    message: "Gallery not found",
  },
  ARTWORK_NOT_FOUND: {
    code: "ARTWORK_NOT_FOUND",
    statusCode: 404,
    message: "Artwork not found",
  },
  ARTIST_NOT_FOUND: {
    code: "ARTIST_NOT_FOUND",
    statusCode: 404,
    message: "Artist not found",
  },
  EXHIBITION_NOT_FOUND: {
    code: "EXHIBITION_NOT_FOUND",
    statusCode: 404,
    message: "Exhibition not found",
  },
  ARTFAIR_NOT_FOUND: {
    code: "ARTFAIR_NOT_FOUND",
    statusCode: 404,
    message: "Art fair not found",
  },
  SHOW_NOT_FOUND: {
    code: "SHOW_NOT_FOUND",
    statusCode: 404,
    message: "Show not found",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    statusCode: 404,
    message: "Resource not found",
  },
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    statusCode: 400,
    message: "Validation failed",
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    statusCode: 500,
    message: "Internal server error",
  },
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    statusCode: 500,
    message: "Unexpected server error",
  },
} as const satisfies Record<string, ErrorDef>;

export function createError(
  errorDef: ErrorDef,
  overrides?: { message?: string; details?: unknown },
): AppError {
  return new AppError(
    errorDef.code,
    errorDef.statusCode,
    overrides?.message ?? errorDef.message,
    overrides?.details,
  );
}
