import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans",
  description: "Compare MeetCast plans and limits.",
};

export default function PlansLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
