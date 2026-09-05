import type { CalendarAccess, CalendarProvider } from "@/types";

export interface ProviderInfo {
  id: CalendarProvider;
  label: string;
  short: string;
  /** How we will talk to it, when the connector is live. */
  protocol: string;
  sync: "two-way" | "read" | "local";
  /** Honest limits — do not promise parity. */
  notes: string;
}

export const CALENDAR_PROVIDERS: ProviderInfo[] = [
  {
    id: "local",
    label: "This app",
    short: "Local",
    protocol: "IndexedDB",
    sync: "local",
    notes: "Objectives, tasks and events you create here. Always writable.",
  },
  {
    id: "google",
    label: "Google Calendar",
    short: "Google",
    protocol: "Calendar API (OAuth 2)",
    sync: "two-way",
    notes: "Incremental sync with a stored sync token. Event colours, Meet links and some private-event rules stay on Google’s side. Planning (goals and tasks) never leaves this app.",
  },
  {
    id: "icloud",
    label: "iCloud Calendar",
    short: "iCloud",
    protocol: "CalDAV + app-specific password",
    sync: "two-way",
    notes: "No REST API and no push: we will poll. Updates use a full iCalendar PUT, not a patch. Subscribe-by-URL is read-only and often hours late — we will not use it for editing.",
  },
  {
    id: "caldav",
    label: "CalDAV",
    short: "CalDAV",
    protocol: "CalDAV (RFC 4791)",
    sync: "two-way",
    notes: "Nextcloud, Fastmail and similar. Same protocol as iCloud, with server-specific gaps.",
  },
];

export function providerInfo(id: CalendarProvider | undefined): ProviderInfo {
  return CALENDAR_PROVIDERS.find((entry) => entry.id === id) ?? CALENDAR_PROVIDERS[0];
}

export function sourceAccess(access: CalendarAccess | undefined): CalendarAccess {
  return access ?? "readwrite";
}
