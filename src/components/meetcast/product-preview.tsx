/**
 * Landing product preview — mirrors meeting room Signal Board language.
 */
export function ProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border border-white/10 bg-[oklch(0.14_0.018_260)] text-[oklch(0.93_0.01_90)]"
    >
      {/* Header rail */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[-0.02em]">
            Weekly standup
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.08em] text-[oklch(0.72_0.12_155)] uppercase before:block before:h-2 before:w-0.5 before:bg-[oklch(0.72_0.12_155)] before:content-['']">
              Live
            </span>
            <span className="font-mono text-[0.625rem] tracking-wide text-white/40">
              4 present
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1fr_9rem]">
        <div className="grid grid-cols-2 gap-px bg-white/8 p-px">
          {[
            { name: "Alex", role: "Host", speaking: true },
            { name: "Sam", role: "", speaking: false },
            { name: "Jordan", role: "", speaking: false },
            { name: "You", role: "", speaking: false },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative aspect-[16/10] bg-[oklch(0.18_0.02_260)] ${
                p.speaking
                  ? "shadow-[inset_3px_0_0_0_oklch(0.72_0.12_55)]"
                  : ""
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-9 items-center justify-center bg-white/8 text-sm font-semibold tracking-tight">
                  {p.name.slice(0, 1)}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate bg-black/55 px-1.5 py-0.5 text-[0.625rem] font-medium">
                  {p.name}
                  {p.role ? ` · ${p.role}` : ""}
                </span>
                {p.speaking ? (
                  <span className="font-mono text-[0.5625rem] tracking-wide text-[oklch(0.78_0.1_55)] uppercase">
                    Spk
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <aside className="hidden flex-col border-l border-white/10 sm:flex">
          <div className="border-b border-white/10 px-2.5 py-2 font-mono text-[0.625rem] tracking-[0.1em] text-white/40 uppercase">
            Chat
          </div>
          <div className="flex flex-1 flex-col gap-3 p-2.5 text-[0.6875rem] leading-snug">
            <div>
              <p className="font-mono text-[0.5625rem] tracking-wide text-[oklch(0.75_0.1_55)] uppercase">
                Sam
              </p>
              <p className="text-white/70">Agenda is up</p>
            </div>
            <div>
              <p className="font-mono text-[0.5625rem] tracking-wide text-[oklch(0.75_0.1_55)] uppercase">
                Alex
              </p>
              <p className="text-white/70">Starting now</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Control cluster */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-[oklch(0.11_0.016_260)] px-3 py-2.5">
        <div className="flex gap-px bg-white/10 p-px">
          <span className="flex h-8 w-8 items-center justify-center bg-[oklch(0.18_0.02_260)] text-[0.5625rem] font-mono tracking-wide">
            MIC
          </span>
          <span className="flex h-8 w-8 items-center justify-center bg-[oklch(0.18_0.02_260)] text-[0.5625rem] font-mono tracking-wide">
            CAM
          </span>
        </div>
        <div className="flex gap-1">
          {["SHR", "HND", "CHT"].map((label) => (
            <span
              key={label}
              className="flex h-8 w-8 items-center justify-center border border-white/10 text-[0.5625rem] font-mono tracking-wide text-white/50"
            >
              {label}
            </span>
          ))}
        </div>
        <span className="ml-auto flex h-8 items-center border border-[oklch(0.55_0.15_25/0.5)] px-2.5 text-[0.5625rem] font-mono tracking-wide text-[oklch(0.75_0.12_25)]">
          LEAVE
        </span>
      </div>
    </div>
  );
}
