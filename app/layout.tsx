import type { Metadata } from "next";
import "./globals.css";
import { fontClassNames } from "@/app/fonts";
import { AppearanceProvider } from "@/components/layout/AppearanceProvider";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Planner",
  description:
    "Calendars for each area of your life, with objectives, tasks and events on one timeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontClassNames}>
      <body>
        <AppearanceProvider>
          <div className="flex h-dvh flex-col">
            <Header />
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
          </div>
        </AppearanceProvider>
      </body>
    </html>
  );
}
