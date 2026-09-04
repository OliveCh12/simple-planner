"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { AccentPicker } from "@/components/settings/AccentPicker";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FONT_OPTIONS, getFontOption, type FontId } from "@/lib/fonts";
import { useUIStore } from "@/store/uiStore";
import type { AppSettings } from "@/types";

const MODES: { value: AppSettings["theme"]; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "auto", label: "System", icon: Monitor },
];

export default function AppearanceSettingsPage() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const font = getFontOption(settings.font);

  return (
    <SettingsSection title="Appearance" description="Mode, accent color and typography.">
      <FieldGroup>
        <Field orientation="responsive">
          <FieldContent>
            <FieldTitle>Mode</FieldTitle>
            <FieldDescription>Follow the system, or pick one.</FieldDescription>
          </FieldContent>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Mode"
            value={settings.theme}
            onValueChange={(value) => {
              if (value) updateSettings({ theme: value as AppSettings["theme"] });
            }}
          >
            {MODES.map((mode) => (
              <ToggleGroupItem key={mode.value} value={mode.value}>
                <mode.icon />
                {mode.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field orientation="responsive">
          <FieldContent>
            <FieldTitle>Accent</FieldTitle>
            <FieldDescription>
              Each accent has a light and a dark variant, so it adapts to the mode.
            </FieldDescription>
          </FieldContent>
          <AccentPicker
            value={settings.accent}
            onChange={(accent) => updateSettings({ accent })}
          />
        </Field>

        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="font">Font</FieldLabel>
            <FieldDescription style={{ fontFamily: `var(${font.cssVar})` }}>
              {font.preview}. The quick brown fox jumps over the lazy dog.
            </FieldDescription>
          </FieldContent>
          <Select
            value={settings.font}
            onValueChange={(value) => updateSettings({ font: value as FontId })}
          >
            <SelectTrigger id="font" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  style={{ fontFamily: `var(${option.cssVar})` }}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}
