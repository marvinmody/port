export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ")

/** DD.MM.YY in the given timezone. */
export function shortDate(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("day")}.${get("month")}.${get("year")}`
}
