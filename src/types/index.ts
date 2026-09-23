export interface AuthUser {
  id: string;
  email: string;
  slug: string;
  name: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  slug: string;
  iat?: number;
  exp?: number;
}

export interface GallerySummary {
  id: string;
  title: string;
}

export interface SignupResponse {
  user: AuthUser;
  gallery: GallerySummary;
}

export interface LoginResponse {
  user: AuthUser;
  gallery: GallerySummary;
  accessToken: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface PaginatedExhibitions<T> {
  exhibitions: T[];
  total: number;
  page: number;
  pages: number;
}

export interface PaginatedArtFairs<T> {
  artFairs: T[];
  total: number;
  page: number;
  pages: number;
}

export interface UploadResponse {
  url: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
