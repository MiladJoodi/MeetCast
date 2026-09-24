export const ADMIN_PAGE_SIZE = 10;
export const ADMIN_MAX_PAGE = 10_000;
export const ADMIN_MAX_SEARCH_LENGTH = 100;

export function clampAdminPage(page: number): number {
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.min(Math.floor(page), ADMIN_MAX_PAGE);
}

export function normalizeAdminSearchQuery(query?: string): string {
  const q = query?.trim() ?? "";
  if (q.length === 0) {
    return "";
  }
  // Strip LIKE wildcards so user input is matched literally.
  return q.replace(/[%_]/g, "").slice(0, ADMIN_MAX_SEARCH_LENGTH);
}

export function clampPageToTotal(
  page: number,
  total: number,
  pageSize: number = ADMIN_PAGE_SIZE,
): number {
  const safePage = clampAdminPage(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(safePage, totalPages);
}

export function totalPages(total: number, pageSize = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
