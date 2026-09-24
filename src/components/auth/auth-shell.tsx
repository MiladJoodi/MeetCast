import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Dark room canvas shared by login / register (matches landing + invite). */
export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="mc-invite-page relative isolate flex flex-1 flex-col overflow-hidden text-[var(--room-fg)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-grid opacity-[0.08]" />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-12 pt-20 sm:px-6",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full space-y-6 rounded-2xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-6 shadow-[0_28px_70px_-28px_oklch(0_0_0/0.55)] sm:p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const authFieldClassName =
  "border-white/20 bg-white/8 text-white placeholder:text-white/35 focus-visible:border-white/40";

export const authLabelClassName = "text-white/70";

export const authErrorClassName =
  "text-[color-mix(in_oklch,var(--danger)_90%,white)]";

export const authAlertClassName =
  "rounded-lg border border-danger/35 bg-danger/15 px-3 py-2.5 text-sm text-[color-mix(in_oklch,var(--danger)_90%,white)]";

export const authNoticeClassName =
  "rounded-lg border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white/75";

export const authPrimaryButtonClassName =
  "border-transparent bg-white text-[oklch(0.2_0.03_160)] hover:bg-white/90";
