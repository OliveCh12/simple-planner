"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CalendarDays, Database, HardDrive, Keyboard, Palette, Tags, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/dates", label: "Dates", icon: CalendarDays },
  { href: "/settings/people", label: "People", icon: Users },
  { href: "/settings/categories", label: "Categories", icon: Tags },
  { href: "/settings/data", label: "Data", icon: Database },
  { href: "/settings/storage", label: "Storage", icon: HardDrive },
  { href: "/settings/shortcuts", label: "Shortcuts", icon: Keyboard },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 md:sticky md:top-0 md:w-44 md:self-start">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="mb-4 hidden justify-start text-muted-foreground md:inline-flex"
      >
        <Link href="/">
          <ArrowLeft />
          Plans
        </Link>
      </Button>
      <nav
        aria-label="Settings sections"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] md:mx-0 md:flex-col md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {SECTIONS.map((section) => {
          const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
            <Button
              key={section.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "shrink-0 justify-start",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={section.href} aria-current={active ? "page" : undefined}>
                <section.icon />
                {section.label}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
