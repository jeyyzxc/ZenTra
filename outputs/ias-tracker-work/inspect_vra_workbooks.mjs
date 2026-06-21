import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const files = [
  "C:/Users/jerom/Downloads/Vulnerability Risk Analysis Tracker - CASAVERA FURNITURE.xlsx",
  "C:/Users/jerom/Downloads/Vulnerability-Risk-Analysis-Tracker-CASAVERA-FURNITURE.xlsx",
];

for (const file of files) {
  console.log(`=== FILE: ${file} ===`);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
  const summary = await workbook.inspect({
    kind: "workbook,sheet,table",
    maxChars: 14000,
    tableMaxRows: 12,
    tableMaxCols: 12,
    tableMaxCellChars: 180,
  });
  console.log(summary.ndjson);

  for (const sheet of workbook.worksheets.items) {
    console.log(`=== ${sheet.name} A1:N80 ===`);
    const table = await workbook.inspect({
      kind: "table",
      range: `'${sheet.name}'!A1:N80`,
      include: "values,formulas",
      tableMaxRows: 80,
      tableMaxCols: 14,
      tableMaxCellChars: 240,
      maxChars: 30000,
    });
    console.log(table.ndjson);

    console.log(`=== ${sheet.name} FORMULAS ===`);
    const formulas = await workbook.inspect({
      kind: "formula",
      sheetId: sheet.name,
      range: "A1:N80",
      maxChars: 10000,
      options: { maxResults: 300 },
    });
    console.log(formulas.ndjson);
  }
}

