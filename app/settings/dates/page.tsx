"use client";

import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateDisplay } from "@/lib/date-utils";
import { useUIStore } from "@/store/uiStore";

const DATE_FORMATS = ["MMM d, yyyy", "d MMM yyyy", "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"];

export default function DatesSettingsPage() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <SettingsSection title="Dates" description="How dates and weeks are displayed.">
      <FieldGroup>
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="first-day">Week starts on</FieldLabel>
          </FieldContent>
          <Select
            value={String(settings.firstDayOfWeek)}
            onValueChange={(value) => updateSettings({ firstDayOfWeek: Number(value) as 0 | 1 })}
          >
            <SelectTrigger id="first-day" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="0">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="date-format">Date format</FieldLabel>
            <FieldDescription>
              Today reads {formatDateDisplay(new Date(), settings.dateFormat)}.
            </FieldDescription>
          </FieldContent>
          <Select
            value={settings.dateFormat}
            onValueChange={(value) => updateSettings({ dateFormat: value })}
          >
            <SelectTrigger id="date-format" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}
