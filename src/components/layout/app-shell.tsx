import { AppSidebar, type AppSidebarUser } from "@/components/layout/app-sidebar";

type AppShellProps = {
  user: AppSidebarUser;
  children: React.ReactNode;
};

/**
 * Mobile: column (bar on top, content full width — no empty left rail).
 * Desktop: centered capped card with sidebar + content on fog canvas.
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="mc-fog flex flex-1 justify-center lg:px-4 lg:py-5">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden border-border/60 bg-background/90 backdrop-blur-[2px] lg:min-h-0 lg:flex-row lg:rounded-[1.25rem] lg:border lg:shadow-[0_20px_56px_-28px_oklch(0.28_0.05_155/0.4)]">
        <AppSidebar user={user} />
        <div className="flex min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
