/** Quote text cells and neutralize spreadsheet formula prefixes, including hidden whitespace. */
export function csvCell(value: string | number | null | undefined): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(',') + '\r\n';
}
