import { addHours, format, isValid } from "date-fns";
import { formatLocal, formatLocalDate, isAllDay, joinLocal, parseLocal, splitLocal } from "@/lib/time/local";
import type { Executor, ItemKind, LocalDateTime } from "@/types";

export interface QuickAddCategory {
  id: string;
  name: string;
}

export interface QuickAddContext {
  defaultStart: LocalDateTime;
  defaultEnd?: LocalDateTime;
  now?: Date;
  categories?: QuickAddCategory[];
  defaultExecutor?: Executor;
}

export interface QuickAddResult {
  title: string;
  start: LocalDateTime;
  end?: LocalDateTime;
  recurrence?: string;
  executor: Executor;
  categoryId?: string;
  kind: ItemKind;
  /** The text named a day, time or rhythm; without it a capture stays unscheduled. */
  dated: boolean;
}

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6,
};

/** `today`, `tomorrow`, or a weekday name (the next one, `next` skipping a week). */
function parseDayWord(word: string, next: boolean, now: Date): Date | null {
  const base = startOfDay(now);
  const key = word.toLowerCase();
  if (key === "today") return base;
  if (key === "tomorrow") return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
  const weekday = WEEKDAYS[key];
  if (weekday === undefined) return null;
  let ahead = (weekday - base.getDay() + 7) % 7;
  if (ahead === 0) ahead = 7;
  if (next && ahead < 7) ahead += 7;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + ahead);
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function take(pattern: RegExp, text: string): { value: RegExpMatchArray; rest: string } | null {
  const match = pattern.exec(text);
  if (!match || match.index === undefined) return null;
  const rest = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/\s+/g, " ")
    .trim();
  return { value: match, rest };
}

function parseClock(hour: number, minute: number, meridiem?: string): { hour: number; minute: number } | null {
  if (minute < 0 || minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    const am = meridiem.toLowerCase() === "am";
    if (hour === 12) return { hour: am ? 0 : 12, minute };
    return { hour: am ? hour : hour + 12, minute };
  }
  if (hour < 0 || hour > 23) return null;
  return { hour, minute };
}

function parseUntilDate(raw: string, now: Date, start: Date): Date | null {
  const text = raw.trim().replace(/[.,]$/, "");
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isValid(date) ? date : null;
  }

  const monthDay =
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/i.exec(
      text
    );
  const dayMonth =
    /^(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(\d{4}))?$/i.exec(
      text
    );

  const parsed = monthDay ?? dayMonth;
  if (!parsed) return null;
  const monthToken = (monthDay ? parsed[1] : parsed[2]).toLowerCase();
  const day = Number(monthDay ? parsed[2] : parsed[1]);
  const yearToken = parsed[3];
  const month = MONTHS[monthToken];
  if (month === undefined || day < 1 || day > 31) return null;
  const year = yearToken ? Number(yearToken) : now.getFullYear();
  let date = new Date(year, month, day);
  if (!isValid(date) || date.getDate() !== day) return null;
  if (!yearToken && date < startOfDay(start)) {
    date = new Date(year + 1, month, day);
  }
  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function matchCategory(token: string, categories: QuickAddCategory[]): string | undefined {
  const needle = slug(token);
  const match = categories.find(
    (category) => slug(category.name) === needle || slug(category.id) === needle || slug(category.id) === `cat${needle}`
  );
  return match?.id;
}

function rruleFor(kind: string, until?: Date): string {
  const body =
    kind === "weekday" || kind === "weekdays"
      ? "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
      : kind === "day" || kind === "daily"
        ? "FREQ=DAILY"
        : kind === "week" || kind === "weekly"
          ? "FREQ=WEEKLY"
          : "FREQ=MONTHLY";
  if (!until) return body;
  return `${body};UNTIL=${format(until, "yyyyMMdd")}`;
}

function applyTime(base: LocalDateTime, hour: number, minute: number): LocalDateTime {
  const date = splitLocal(base).date;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return joinLocal(date, `${hh}:${mm}`);
}

/** Parse a quick-add line. Returns null when no title remains. */
export function parseQuickAdd(input: string, context: QuickAddContext): QuickAddResult | null {
  let rest = input.trim();
  if (!rest) return null;
  const now = context.now ?? new Date();
  const categories = context.categories ?? [];

  let executor = context.defaultExecutor ?? ("human" as Executor);
  const executorHit = take(/(?:^|\s)@(ai|human)\b/i, rest);
  if (executorHit) {
    executor = executorHit.value[1].toLowerCase() as Executor;
    rest = executorHit.rest;
  }

  let categoryId: string | undefined;
  const categoryHit = take(/(?:^|\s)#([A-Za-z0-9_-]+)/, rest);
  if (categoryHit) {
    categoryId = matchCategory(categoryHit.value[1], categories);
    rest = categoryHit.rest;
  }

  let until: Date | undefined;
  const untilHit = take(/\buntil\s+(.+?)(?=\s+#|\s+@|$)/i, rest);
  if (untilHit) {
    const parsed = parseUntilDate(untilHit.value[1], now, parseLocal(context.defaultStart));
    if (parsed) {
      until = parsed;
      rest = untilHit.rest;
    }
  }

  let dayWord: Date | undefined;
  const dayHit = take(
    /\b(?:(next)\s+)?(today|tomorrow|sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)\b/i,
    rest
  );
  if (dayHit) {
    const parsed = parseDayWord(dayHit.value[2], Boolean(dayHit.value[1]), now);
    if (parsed) {
      dayWord = parsed;
      rest = dayHit.rest;
    }
  }

  let recurrenceKind: string | undefined;
  const everyHit = take(/\bevery\s+(weekdays?|weekday|day|week|month)\b|\b(daily|weekly|monthly)\b/i, rest);
  if (everyHit) {
    recurrenceKind = (everyHit.value[1] ?? everyHit.value[2]).toLowerCase();
    if (recurrenceKind === "weekdays") recurrenceKind = "weekday";
    rest = everyHit.rest;
  }

  let time: { hour: number; minute: number } | undefined;
  const time12 = take(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i, rest);
  if (time12) {
    const parsed = parseClock(Number(time12.value[1]), Number(time12.value[2] ?? 0), time12.value[3]);
    if (parsed) {
      time = parsed;
      rest = time12.rest;
    }
  } else {
    const time24 = take(/\b([01]?\d|2[0-3]):([0-5]\d)\b/, rest);
    if (time24) {
      const parsed = parseClock(Number(time24.value[1]), Number(time24.value[2]));
      if (parsed) {
        time = parsed;
        rest = time24.rest;
      }
    }
  }

  const title = rest.replace(/\s+/g, " ").trim();
  if (!title) return null;

  let start = context.defaultStart;
  if (dayWord) start = formatLocalDate(dayWord);
  if (time) start = applyTime(start, time.hour, time.minute);

  let end = context.defaultEnd;
  if (time) {
    end = formatLocal(addHours(parseLocal(start), 1), false);
  } else if (until && !recurrenceKind) {
    end = formatLocalDate(until);
    if (!isAllDay(start)) start = formatLocalDate(parseLocal(start));
  } else if (dayWord) {
    end = undefined;
  } else if (time === undefined && context.defaultEnd && isAllDay(start)) {
    end = context.defaultEnd;
  }

  const result: QuickAddResult = {
    title,
    start,
    executor,
    kind: "task",
    dated: Boolean(time || until || recurrenceKind || dayWord),
  };
  if (end) result.end = end;
  if (recurrenceKind) result.recurrence = rruleFor(recurrenceKind, until);
  if (categoryId) result.categoryId = categoryId;
  return result;
}

export function describeQuickAdd(result: QuickAddResult, categories: QuickAddCategory[] = []): string {
  const parts: string[] = [];
  if (result.recurrence?.includes("BYDAY=MO,TU,WE,TH,FR")) parts.push("Weekdays");
  else if (result.recurrence?.startsWith("FREQ=DAILY")) parts.push("Daily");
  else if (result.recurrence?.startsWith("FREQ=WEEKLY")) parts.push("Weekly");
  else if (result.recurrence?.startsWith("FREQ=MONTHLY")) parts.push("Monthly");
  if (!isAllDay(result.start)) parts.push(format(parseLocal(result.start), "HH:mm"));
  const until = result.recurrence?.match(/UNTIL=(\d{8})/);
  if (until) {
    const stamp = until[1];
    parts.push(`until ${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`);
  }
  if (result.categoryId) {
    const category = categories.find((entry) => entry.id === result.categoryId);
    if (category) parts.push(category.name);
  }
  if (result.executor === "ai") parts.push("AI");
  return parts.join(" · ");
}
