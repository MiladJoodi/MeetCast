export type DocsNavItem = {
  href: string;
  label: string;
  /** Match pathname exactly (overview). */
  exact?: boolean;
};

export const DOCS_NAV: DocsNavItem[] = [
  { href: "/docs", label: "Overview", exact: true },
  { href: "/docs/getting-started", label: "Getting started" },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "/docs/authentication", label: "Authentication" },
  { href: "/docs/meetings", label: "Meetings" },
  { href: "/docs/realtime", label: "Realtime" },
  { href: "/docs/plans", label: "Plans" },
  { href: "/docs/billing", label: "Billing" },
  { href: "/docs/security", label: "Security" },
  { href: "/docs/deployment", label: "Deployment" },
  { href: "/docs/troubleshooting", label: "Troubleshooting" },
];

export function docsNavIndex(pathname: string): number {
  return DOCS_NAV.findIndex((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function docsPrevNext(pathname: string): {
  prev: DocsNavItem | null;
  next: DocsNavItem | null;
} {
  const index = docsNavIndex(pathname);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? DOCS_NAV[index - 1]! : null,
    next: index < DOCS_NAV.length - 1 ? DOCS_NAV[index + 1]! : null,
  };
}

export function isDocsPath(pathname: string): boolean {
  return pathname === "/docs" || pathname.startsWith("/docs/");
}
