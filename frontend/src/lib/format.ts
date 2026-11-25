import { TZ } from "./catalog";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

const dayFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: TZ,
});

const whenFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TZ,
});

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function formatDay(iso: string) {
  return dayFmt.format(new Date(iso));
}

export function formatWhen(iso: string) {
  return whenFmt.format(new Date(iso));
}

export function khartoumDate(iso: string) {
  return dayKeyFmt.format(new Date(iso));
}

export function formatFee(amount: number) {
  return `SDG ${amount.toLocaleString("en-GB")}`;
}

/** `datetime-local` value interpreted as Africa/Khartoum, not the browser zone. */
export function khartoumLocalToIso(value: string) {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}+02:00`).toISOString();
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
