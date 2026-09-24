import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";

import { AccentProvider } from "@/components/layout/accent-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ACCENT_STORAGE_KEY } from "@/lib/theme/accent";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-meetcast-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MeetCast",
    template: "%s · MeetCast",
  },
  description:
    "Schedule a room, invite people, and meet — video, chat, and clear plan limits.",
};

const accentBootScript = `(function(){try{var k=${JSON.stringify(ACCENT_STORAGE_KEY)};var a=localStorage.getItem(k);if(a)document.documentElement.setAttribute("data-accent",a);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-accent="forest"
      className={`${sourceSans.variable} min-h-full overflow-x-clip antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AccentProvider>
            <SiteHeader />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            <SiteFooter />
            <Toaster />
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
