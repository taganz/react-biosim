import type { Column, LogValue, RowContext } from "./logRows";

export const CSV_SEPARATOR = ";";

const formatters = new Map<string, Intl.NumberFormat>();

/** numbers with the locale's decimal separator and without thousands separators */
function numberFormat(locale: string, decimals: number): Intl.NumberFormat {
  const key = `${locale}/${decimals}`;
  let format = formatters.get(key);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, useGrouping: false });
    } catch {
      // an invalid locale
      format = new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals, useGrouping: false });
    }
    formatters.set(key, format);
  }
  return format;
}

/** decimals of the numbers in the rows of species and creatures */
export const ROW_DECIMALS = 4;

export function formatValue(value: LogValue, locale: string, decimals: number = ROW_DECIMALS): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return Number.isFinite(value) ? numberFormat(locale, decimals).format(value) : "";
  // the separator and line breaks would break the row
  return value.replace(/[;\r\n]/g, " ");
}

export function headerLine<T>(columns: Column<T>[]): string {
  return columns.map((column) => column.name).join(CSV_SEPARATOR) + "\n";
}

export function rowLine<T>(columns: Column<T>[], item: T, context: RowContext, locale: string): string {
  let line = "";
  for (let i = 0; i < columns.length; i++) {
    if (i > 0) line += CSV_SEPARATOR;
    line += formatValue(columns[i].value(item, context), locale);
  }
  return line + "\n";
}
