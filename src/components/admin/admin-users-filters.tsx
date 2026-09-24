"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
] as const;

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm";

const SEARCH_DEBOUNCE_MS = 350;

type AdminUsersFiltersProps = {
  total: number;
  q: string;
  role: string;
  from: string;
  to: string;
};

function buildHref(input: {
  q: string;
  role: string;
  from: string;
  to: string;
}) {
  const params = new URLSearchParams();
  const q = input.q.trim();
  if (q) params.set("q", q);
  if (input.role) params.set("role", input.role);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export function AdminUsersFilters({
  total,
  q,
  role,
  from,
  to,
}: AdminUsersFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftRole, setDraftRole] = useState(role);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasFilter = Boolean(role || from || to);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    setDraftRole(role);
    setDraftFrom(from);
    setDraftTo(to);
  }, [role, from, to]);

  useEffect(() => {
    if (!panelOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [panelOpen]);

  function replaceFilters(next: {
    q: string;
    role: string;
    from: string;
    to: string;
  }) {
    const href = buildHref(next);
    const current = `${window.location.pathname}${window.location.search}`;
    if (href === current) return;
    router.replace(href, { scroll: false });
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === q) return;
    const timer = window.setTimeout(() => {
      replaceFilters({ q: trimmed, role, from, to });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, q, role, from, to]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">
          {total} user{total === 1 ? "" : "s"}
          {q || hasFilter ? " · filtered" : ""}
        </p>
      </div>

      <div className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:shrink-0 sm:justify-end">
        <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
            strokeWidth={2}
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            className="h-9 min-w-0 pl-9"
            aria-label="Search users"
            autoComplete="off"
          />
        </div>

        <div className="relative" ref={panelRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "relative size-9",
              panelOpen && "bg-muted",
              hasFilter && "text-brand",
            )}
            aria-label="Filters"
            aria-expanded={panelOpen}
            title="Filters"
            onClick={() => setPanelOpen((open) => !open)}
          >
            <Filter className="size-4" strokeWidth={2} aria-hidden />
            {hasFilter ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand" />
            ) : null}
          </Button>

          {panelOpen ? (
            <div
              role="dialog"
              aria-label="User filters"
              className="absolute top-[calc(100%+0.4rem)] right-0 z-30 w-[min(100vw-2rem,17.5rem)] rounded-xl border border-border/80 bg-background p-3 shadow-lg"
            >
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label
                    htmlFor="admin-users-role"
                    className="text-xs text-muted-foreground"
                  >
                    Role
                  </label>
                  <select
                    id="admin-users-role"
                    value={draftRole}
                    className={selectClassName}
                    onChange={(event) => setDraftRole(event.target.value)}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="admin-users-from"
                    className="text-xs text-muted-foreground"
                  >
                    Created from
                  </label>
                  <Input
                    id="admin-users-from"
                    type="date"
                    value={draftFrom}
                    className="h-9"
                    onChange={(event) => setDraftFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="admin-users-to"
                    className="text-xs text-muted-foreground"
                  >
                    Created to
                  </label>
                  <Input
                    id="admin-users-to"
                    type="date"
                    value={draftTo}
                    className="h-9"
                    onChange={(event) => setDraftTo(event.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      replaceFilters({
                        q: query.trim(),
                        role: draftRole,
                        from: draftFrom,
                        to: draftTo,
                      });
                      setPanelOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  {hasFilter ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDraftRole("");
                        setDraftFrom("");
                        setDraftTo("");
                        replaceFilters({
                          q: query.trim(),
                          role: "",
                          from: "",
                          to: "",
                        });
                        setPanelOpen(false);
                      }}
                    >
                      <X className="size-3.5" aria-hidden />
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {q || hasFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            asChild
          >
            <Link
              href="/admin/users"
              aria-label="Clear all filters"
              title="Clear"
            >
              <X className="size-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
