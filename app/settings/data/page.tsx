"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import {
  clearAllData,
  downloadBackup,
  getAllPlans,
  getDefaultSettings,
  importData,
} from "@/lib/db";
import { usePlanStore } from "@/store/planStore";
import { useUIStore } from "@/store/uiStore";

interface StorageStats {
  plans: number;
  tasks: number;
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export default function DataSettingsPage() {
  const router = useRouter();
  const settings = useUIStore((s) => s.settings);
  const replaceSettings = useUIStore((s) => s.replaceSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllPlans()
      .then((plans) => {
        if (cancelled) return;
        setStats({
          plans: plans.length,
          tasks: plans.reduce((sum, plan) => sum + plan.tasks.length, 0),
        });
      })
      .catch((error) => console.error("Failed to read storage stats:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const json = await file.text();
      const importedSettings = await importData(json);
      replaceSettings(importedSettings);
      usePlanStore.getState().reset();
      toast.success("Backup imported");
      router.push("/");
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import backup. Please try again."
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      replaceSettings(getDefaultSettings());
      usePlanStore.getState().reset();
      setShowClearDialog(false);
      toast.success("All data cleared");
      router.push("/");
    } catch (error) {
      console.error("Failed to clear data:", error);
      toast.error("Failed to clear data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <SettingsSection
      title="Data"
      description={
        stats
          ? `${plural(stats.plans, "plan")} and ${plural(stats.tasks, "task")} stored in this browser.`
          : "Everything is stored in this browser."
      }
    >
      <ItemGroup className="rounded-lg border">
        <Item>
          <ItemMedia variant="icon">
            <Download />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Export backup</ItemTitle>
            <ItemDescription>Download every plan and your settings as JSON.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm" onClick={() => void downloadBackup(settings)}>
              Export
            </Button>
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item>
          <ItemMedia variant="icon">
            <Upload />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Import backup</ItemTitle>
            <ItemDescription>Replaces all current plans with the file contents.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              {isImporting && <Spinner />}
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item>
          <ItemMedia variant="icon" className="text-destructive">
            <Trash2 />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Clear all data</ItemTitle>
            <ItemDescription>Deletes every plan and resets settings.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="destructive" size="sm" onClick={() => setShowClearDialog(true)}>
              Clear
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>

      <ConfirmDialog
        open={showClearDialog}
        title="Clear all data"
        description="This permanently deletes every plan and task stored in this browser. Export a backup first if you need it."
        confirmLabel="Clear all data"
        destructive
        loading={isClearing}
        onConfirm={() => void handleClearAllData()}
        onOpenChange={(open) => {
          if (!isClearing) setShowClearDialog(open);
        }}
      />
    </SettingsSection>
  );
}
