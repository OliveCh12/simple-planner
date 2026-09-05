import { NotConfiguredError } from "@/lib/repository/types";
import type { CalendarProvider, CalendarSource, LocalDateTime } from "@/types";

/**
 * An event as a provider hands it to us. Providers only know events: goals,
 * projects, tasks and every planning link stay in this app.
 */
export interface ExternalEvent {
  /** Provider id of the event. */
  id: string;
  /** Provider id of the calendar it lives in. */
  calendarId: string;
  title: string;
  notes?: string;
  start: LocalDateTime;
  end?: LocalDateTime;
  recurrence?: string;
  location?: string;
  /** Version marker; a change on the provider changes it. */
  etag?: string;
  updatedAt?: string;
  cancelled?: boolean;
}

export interface RemoteChanges {
  events: ExternalEvent[];
  /** Ids the provider reports as deleted since the last token. */
  deletedIds: string[];
  /** Token to resume from next time; absent means the provider needs full pulls. */
  syncToken?: string;
}

/** What every connector implements. Read first; write only on `readwrite` sources. */
export interface CalendarAdapter {
  provider: CalendarProvider;
  /** Pull events changed since `syncToken`, or everything in the range when it is absent. */
  pull(source: CalendarSource, range: { from: string; to: string }, syncToken?: string): Promise<RemoteChanges>;
  create(source: CalendarSource, event: Omit<ExternalEvent, "id" | "etag">): Promise<ExternalEvent>;
  update(source: CalendarSource, event: ExternalEvent): Promise<ExternalEvent>;
  remove(source: CalendarSource, id: string): Promise<void>;
}

/** The app's own calendars: nothing to pull, nothing to push. */
export class LocalAdapter implements CalendarAdapter {
  provider: CalendarProvider = "local";
  async pull(): Promise<RemoteChanges> {
    return { events: [], deletedIds: [] };
  }
  async create(): Promise<ExternalEvent> {
    throw new NotConfiguredError("A local calendar has no remote side");
  }
  async update(): Promise<ExternalEvent> {
    throw new NotConfiguredError("A local calendar has no remote side");
  }
  async remove(): Promise<void> {
    throw new NotConfiguredError("A local calendar has no remote side");
  }
}

/** Placeholder until a connector is wired: every call says what is missing. */
export class UnconnectedAdapter implements CalendarAdapter {
  constructor(
    public provider: CalendarProvider,
    private readonly label: string
  ) {}
  private refuse(): never {
    throw new NotConfiguredError(`${this.label} is not connected yet`);
  }
  async pull(): Promise<RemoteChanges> {
    this.refuse();
  }
  async create(): Promise<ExternalEvent> {
    this.refuse();
  }
  async update(): Promise<ExternalEvent> {
    this.refuse();
  }
  async remove(): Promise<void> {
    this.refuse();
  }
}

const adapters = new Map<CalendarProvider, CalendarAdapter>([
  ["local", new LocalAdapter()],
  ["google", new UnconnectedAdapter("google", "Google Calendar")],
  ["icloud", new UnconnectedAdapter("icloud", "iCloud Calendar")],
  ["caldav", new UnconnectedAdapter("caldav", "CalDAV")],
]);

export function adapterFor(provider: CalendarProvider | undefined): CalendarAdapter {
  return adapters.get(provider ?? "local") ?? adapters.get("local")!;
}

/** Connectors register here once they exist; tests register fakes. */
export function registerAdapter(adapter: CalendarAdapter): void {
  adapters.set(adapter.provider, adapter);
}
