import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque} from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SubHeader } from "@/components/layout/SubHeader";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
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
        className={`${bricolageGrotesque.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <SubHeader />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
