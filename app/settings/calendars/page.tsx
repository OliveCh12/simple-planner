"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Cloud, HardDrive, Lock } from "lucide-react";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { SourceMark } from "@/components/plan/SourceMark";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { startDemoSeed } from "@/lib/seed";
import { CALENDAR_PROVIDERS } from "@/lib/sync/providers";
import { usePlannerStore } from "@/store/plannerStore";

export default function CalendarsSettingsPage() {
  const plans = usePlannerStore((s) => s.plans);
  const loadPlans = usePlannerStore((s) => s.loadPlans);

  useEffect(() => {
    void startDemoSeed().then(() => loadPlans());
  }, [loadPlans]);

  return (
    <SettingsSection
      title="Calendars"
      description="A calendar is a time context — personal, work, family, or a feed from Google or iCloud. Goals and tasks live in this app and can sit beside those events without becoming them."
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-medium">In this browser</h3>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No calendars yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {plans.map((plan) => (
                <li key={plan.id} className="flex items-center gap-3 px-3 py-2.5">
                  <CalendarDot color={plan.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.source?.provider === "google"
                        ? "Google"
                        : plan.source?.provider === "icloud"
                          ? "iCloud"
                          : "Local"}
                      {plan.source?.access === "readonly" ? " · read-only" : " · writable"}
                    </p>
                  </div>
                  <SourceMark source={plan.source} />
                  <Button variant="ghost" size="xs" asChild>
                    <Link href={`/plan/${plan.id}`}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Connect a source</h3>
          <p className="text-sm text-muted-foreground">
            Connectors land in this order: Google Calendar (OAuth, two-way events), then iCloud
            (CalDAV + app-specific password, polled), then other CalDAV servers. Until then, create
            local calendars — your goals and tasks already attach to them.
          </p>
          <ul className="space-y-3">
            {CALENDAR_PROVIDERS.filter((provider) => provider.id !== "local").map((provider) => (
              <li key={provider.id} className="space-y-1 rounded-lg border px-3 py-3">
                <div className="flex items-center gap-2">
                  {provider.sync === "local" ? (
                    <HardDrive className="size-4 text-muted-foreground" />
                  ) : (
                    <Cloud className="size-4 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium">{provider.label}</p>
                  <span className="text-xs text-muted-foreground">{provider.protocol}</span>
                </div>
                <p className="text-sm text-muted-foreground">{provider.notes}</p>
                <Button type="button" size="xs" variant="outline" disabled>
                  {provider.id === "google" ? "Connect Google" : `Connect ${provider.short}`}
                </Button>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Synced events keep their source. Objectives, tasks and prep never upload to Google or
            iCloud. A read-only calendar can still hold local planning.
          </p>
        </section>
      </div>
    </SettingsSection>
  );
}
