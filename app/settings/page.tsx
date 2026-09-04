"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Palette, Clock, AlertTriangle, Upload, Download, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { containerClasses } from "@/lib/utils";
import { clearAllData, downloadBackup, getDefaultSettings, importData } from "@/lib/db";
import { FONT_OPTIONS, getFontOption, type FontId } from "@/lib/fonts";
import { useUIStore } from "@/store/uiStore";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { AppSettings } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const replaceSettings = useUIStore((s) => s.replaceSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setStatusMessage(null);
    try {
      const json = await file.text();
      const importedSettings = await importData(json);
      replaceSettings(importedSettings);
      useRoadmapStore.getState().reset();
      router.push("/");
    } catch (error) {
      console.error("Failed to import data:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to import backup. Please try again."
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    try {
      await clearAllData();
      replaceSettings(getDefaultSettings());
      useRoadmapStore.getState().reset();
      setShowClearDataDialog(false);
      router.push("/");
    } catch (error) {
      console.error("Failed to clear data:", error);
      setStatusMessage("Failed to clear data. Please try again.");
    } finally {
      setIsClearingData(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className={`py-8 ${containerClasses()}`}>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Preferences are stored in this browser. Roadmaps live in IndexedDB.
            </p>
          </div>

          {statusMessage && (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) =>
                      updateSettings({ theme: value as AppSettings["theme"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Font
                  </Label>
                  <Select
                    value={settings.font}
                    onValueChange={(value) => updateSettings({ font: value as FontId })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem
                          key={font.id}
                          value={font.id}
                          style={{ fontFamily: `var(${font.cssVar})` }}
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: `var(${getFontOption(settings.font).cssVar})` }}
                  >
                    {getFontOption(settings.font).preview} — The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Week starts on</Label>
                  <Select
                    value={String(settings.firstDayOfWeek)}
                    onValueChange={(value) =>
                      updateSettings({ firstDayOfWeek: Number(value) as 0 | 1 })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => updateSettings({ dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MMM d, yyyy">MMM d, yyyy</SelectItem>
                      <SelectItem value="d MMM yyyy">d MMM yyyy</SelectItem>
                      <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Export a JSON backup before clearing or switching browsers. Import replaces all current roadmaps.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => downloadBackup(settings)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export backup
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? "Importing…" : "Import backup"}
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
                <Button
                  variant="destructive"
                  className="justify-start md:col-span-2"
                  onClick={() => setShowClearDataDialog(true)}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear all data
                </Button>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Appearance preferences save automatically in this browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear all data
            </DialogTitle>
            <DialogDescription>
              This permanently deletes every roadmap and objective stored in this browser. Export a backup first if you need it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDataDialog(false)}
              disabled={isClearingData}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllData}
              disabled={isClearingData}
            >
              {isClearingData ? "Clearing…" : "Clear all data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
