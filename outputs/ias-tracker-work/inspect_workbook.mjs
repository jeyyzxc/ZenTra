import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/jerom/Downloads/IAS Test Cases Progress Tracker.xlsx";

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 14000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});
console.log("=== SUMMARY ===");
console.log(summary.ndjson);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 4000,
});
console.log("=== SHEETS ===");
console.log(sheets.ndjson);

for (const sheet of workbook.worksheets.items) {
  console.log(`=== ${sheet.name} :: A1:Z80 ===`);
  const table = await workbook.inspect({
    kind: "table",
    range: `'${sheet.name}'!A1:Z80`,
    include: "values,formulas",
    tableMaxRows: 80,
    tableMaxCols: 26,
    tableMaxCellChars: 220,
    maxChars: 30000,
  });
  console.log(table.ndjson);

  console.log(`=== ${sheet.name} :: FORMULAS A1:I45 ===`);
  const formulas = await workbook.inspect({
    kind: "formula",
    sheetId: sheet.name,
    range: "A1:I45",
    maxChars: 8000,
    options: { maxResults: 200 },
  });
  console.log(formulas.ndjson);

  console.log(`=== ${sheet.name} :: STYLES A9:I18 ===`);
  const styles = await workbook.inspect({
    kind: "computedStyle",
    sheetId: sheet.name,
    range: "A9:I18",
    maxChars: 12000,
  });
  console.log(styles.ndjson);
}
