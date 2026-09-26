import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "MeetCast — video meetings with scheduled rooms",
  description:
    "Schedule a room, invite people, and meet — with guest access, chat, and plan limits.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const user = await getCurrentUser();
  return <LandingPage user={user ? { id: user.id } : null} />;
}
