import { cn } from "@/lib/utils";

const STEPS = [
  { id: "review", label: "Review" },
  { id: "pay", label: "Pay" },
  { id: "done", label: "Done" },
] as const;

export type CheckoutStepId = (typeof STEPS)[number]["id"];

type CheckoutStepsProps = {
  current: CheckoutStepId;
};

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="mx-auto flex w-full max-w-md items-center gap-2">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  done && "bg-brand text-primary-foreground",
                  active && "bg-foreground text-background",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-[0.7rem] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "mb-5 h-px w-full max-w-[2.5rem] shrink-0",
                  index < currentIndex ? "bg-brand" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
