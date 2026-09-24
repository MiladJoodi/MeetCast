type DocsPageProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function DocsPage({ title, description, children }: DocsPageProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] sm:text-[2rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
          {description}
        </p>
      </header>
      <div className="space-y-8 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:text-muted-foreground [&_p_strong]:font-medium [&_p_strong]:text-foreground [&_table]:w-full [&_table]:text-left [&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_td]:text-muted-foreground [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-3 [&_th]:font-medium [&_th]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:text-foreground">
        {children}
      </div>
    </div>
  );
}
