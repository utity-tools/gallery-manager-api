export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  order: string;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePaginationParams(
  query: Record<string, unknown>,
): PaginationParams {
  return {
    page: parsePositiveInt(query.page, 1),
    limit: parsePositiveInt(query.limit, 12),
    sortBy: typeof query.sortBy === "string" ? query.sortBy : "createdAt",
    order: typeof query.order === "string" ? query.order : "desc",
  };
}
