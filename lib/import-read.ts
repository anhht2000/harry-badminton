import * as XLSX from "xlsx";

export type RawRow = Record<string, string>;

export function readImportFile(data: ArrayBuffer | Uint8Array): RawRow[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
}
