import { SettingsNav } from "@/components/settings/SettingsNav";
import { cn, containerClasses } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className={cn(
          containerClasses(),
          "flex flex-col gap-6 py-6 md:flex-row md:gap-12 md:py-10"
        )}
      >
        <SettingsNav />
        <div className="min-w-0 max-w-2xl flex-1">{children}</div>
      </div>
    </div>
  );
}
