import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, Ubuntu} from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { containerClasses } from "@/lib/utils";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Timeline Planner - Plan Your Goals Across Time",
  description: "A visual roadmap application to plan and track life goals, projects, and objectives across time with an elegant, minimalist interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ubuntu.variable} antialiased`}
      >
        <div className="flex h-screen flex-col">
          <Header />
          <main className={`flex flex-1 flex-col overflow-hidden `}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
