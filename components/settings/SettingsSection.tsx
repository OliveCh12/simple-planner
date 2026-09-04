"use client";

import { Spinner } from "@/components/ui/spinner";
import { useHydrated } from "@/hooks/useHydrated";

interface SettingsSectionProps {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}

/** Section shell; defers persisted-settings UI until the client store is hydrated. */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const hydrated = useHydrated();

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {hydrated ? (
        children
      ) : (
        <div className="flex justify-center py-12">
          <Spinner className="text-muted-foreground" />
        </div>
      )}
    </section>
  );
}
