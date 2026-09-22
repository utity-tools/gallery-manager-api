export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  order: string;
}

const MAX_LIMIT = 100;

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePaginationParams(
  query: Record<string, unknown>,
): PaginationParams {
  const limit = parsePositiveInt(query.limit, 12);
  return {
    page: parsePositiveInt(query.page, 1),
    limit: Math.min(limit, MAX_LIMIT),
    sortBy: typeof query.sortBy === "string" ? query.sortBy : "createdAt",
    order: typeof query.order === "string" ? query.order : "desc",
  };
}
