// Minimal CSV <-> JSON helpers for admin import/export widgets (B8 "Dữ liệu"). Good enough for
// admin bulk uploads of a few hundred rows — not a streaming parser for huge files.
// shortcut: whole file is parsed in memory; switch to a streaming parser if imports start running
// into multi-MB CSVs.

/** Parses CSV text (RFC4180-ish: quoted fields, "" escape, embedded commas/newlines) into one
 * plain object per data row, keyed by the header row. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') pushField();
    else if (c === '\n') pushRow();
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) pushRow();

  const nonEmpty = rows.filter((r) => r.length > 1 || r[0] !== '');
  const [header, ...dataRows] = nonEmpty;
  if (!header) return [];
  return dataRows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const BOM = String.fromCharCode(0xfeff);

function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Converts rows to CSV text (BOM-prefixed so Excel reads UTF-8 correctly) — mirrors the backend's
 * utils/csv.js convention, for data the frontend already has as JSON. */
export function toCsv<T>(rows: T[], columns: { header: string; value: (row: T) => unknown }[]): string {
  const lines = [columns.map((c) => escapeCsvCell(c.header)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => escapeCsvCell(c.value(row))).join(',')));
  return `${BOM}${lines.join('\r\n')}\r\n`;
}
