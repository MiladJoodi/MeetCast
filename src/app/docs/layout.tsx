import type { Metadata } from "next";

import { DocsShell } from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How MeetCast is built, configured, and run — for developers working on the project.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
