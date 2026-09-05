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
import { Switch } from "@/components/ui/switch";
import { formatDateDisplay } from "@/lib/date-utils";
import { useUIStore } from "@/store/uiStore";

const DATE_FORMATS = ["MMM d, yyyy", "d MMM yyyy", "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"];

export default function DatesSettingsPage() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <SettingsSection title="Dates & grid" description="How dates, weeks and the hour grid behave.">
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

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="week-numbers">Week numbers</FieldLabel>
            <FieldDescription>Shown in the header of week columns.</FieldDescription>
          </FieldContent>
          <Switch
            id="week-numbers"
            checked={settings.showWeekNumbers}
            onCheckedChange={(checked) => updateSettings({ showWeekNumbers: checked })}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="hover-preview">Placement preview</FieldLabel>
            <FieldDescription>
              In week and day views, a faint slot follows the mouse over empty time to show where a click creates an event.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="hover-preview"
            checked={settings.hoverPreview}
            onCheckedChange={(checked) => updateSettings({ hoverPreview: checked })}
          />
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
