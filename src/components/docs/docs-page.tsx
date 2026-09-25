type DocsPageProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function DocsPage({ title, description, children }: DocsPageProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3 pb-6">
        <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-white text-balance">
          {title}
        </h1>
        <span className="mc-mkt-rule block h-px w-14 bg-[color-mix(in_oklch,var(--live)_85%,white)]" />
        <p className="max-w-2xl text-sm leading-relaxed text-white/55 sm:text-[0.9375rem]">
          {description}
        </p>
      </header>
      <div className="space-y-8 text-sm leading-relaxed text-white/80 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-white [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_li]:my-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:text-white/55 [&_p_strong]:font-medium [&_p_strong]:text-white [&_table]:w-full [&_table]:text-left [&_td]:border-b [&_td]:border-white/10 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_td]:text-white/55 [&_th]:border-b [&_th]:border-white/10 [&_th]:py-2 [&_th]:pr-3 [&_th]:font-medium [&_th]:text-white [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-white/55 [&_a]:font-medium [&_a]:text-white [&_a]:underline [&_a]:underline-offset-3 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:text-white">
        {children}
      </div>
    </div>
  );
}
