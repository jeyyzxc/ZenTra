import fs from 'node:fs';
import path from 'node:path';
import type { ExportSheet } from '@/lib/export/types';
import { safeExportText } from '@/lib/export/csv';

type XlsxFile = {
  name: string;
  content: string | Uint8Array;
};

type WorkbookLogo = {
  contentType: string;
  data: Buffer;
  extension: 'jpg' | 'png';
};

const BRAND_ROW_COUNT = 5;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

function uint16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files: XlsxFile[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = typeof file.content === 'string'
      ? encoder.encode(file.content)
      : file.content;
    const checksum = crc32(contentBytes);

    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(checksum),
      uint32(contentBytes.length),
      uint32(contentBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, contentBytes);

    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(checksum),
      uint32(contentBytes.length),
      uint32(contentBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBytes,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, end]);
}

function columnName(index: number) {
  let name = '';
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function sanitizeSheetName(value: string, fallback: string) {
  const cleaned = value.replace(/[\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || fallback).slice(0, 31);
}

function getZionLogo(): WorkbookLogo | null {
  const logoCandidates: WorkbookLogo[] = [
    {
      contentType: 'image/png',
      data: Buffer.alloc(0),
      extension: 'png',
    },
    {
      contentType: 'image/jpeg',
      data: Buffer.alloc(0),
      extension: 'jpg',
    },
  ];
  const logoPaths = [
    path.join(process.cwd(), 'public', 'zion-logo.png'),
    path.join(process.cwd(), 'public', 'zion', 'zionlogo.jpg'),
  ];

  for (const [index, logoPath] of logoPaths.entries()) {
    try {
      return {
        ...logoCandidates[index],
        data: fs.readFileSync(logoPath),
      };
    } catch {
      continue;
    }
  }

  return null;
}

function emu(px: number) {
  return Math.round(px * 9525);
}

function excelSerialDate(value: Date) {
  return (Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds()) / 86_400_000) + 25569;
}

type CellType = NonNullable<NonNullable<ExportSheet['columns']>[number]['type']>;

function styleIndex(
  type: CellType | undefined,
  rowIndex: number,
  headerRowIndex: number | null,
  hasBrandHeader: boolean,
) {
  if (hasBrandHeader && rowIndex === 1) return 9;
  if (hasBrandHeader && rowIndex === 2) return 10;
  if (hasBrandHeader && rowIndex === 3) return 11;
  if (hasBrandHeader && rowIndex === 4) return 12;
  if (headerRowIndex && rowIndex === headerRowIndex) return 1;
  if (type === 'currency') return 4;
  if (type === 'number') return 5;
  if (type === 'date') return 6;
  if (type === 'datetime') return 7;
  if (type === 'boolean') return 8;
  return 3;
}

function xlsxCell(
  value: string | number | boolean | Date | null | undefined,
  rowIndex: number,
  columnIndex: number,
  type: NonNullable<ExportSheet['columns']>[number]['type'],
  headerRowIndex: number | null,
  hasBrandHeader: boolean,
) {
  const reference = `${columnName(columnIndex)}${rowIndex}`;
  const style = styleIndex(type, rowIndex, headerRowIndex, hasBrandHeader);

  if (value === null || value === undefined || value === '') {
    return `<c r="${reference}" s="${style}"/>`;
  }

  if (value instanceof Date) {
    return `<c r="${reference}" s="${style}"><v>${excelSerialDate(value)}</v></c>`;
  }

  if (typeof value === 'number') {
    return `<c r="${reference}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
  }

  if (typeof value === 'boolean') {
    return `<c r="${reference}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(safeExportText(value))}</t></is></c>`;
}

function brandRows() {
  return [
    ['', '', 'ZION EVENTS PLACE'],
    ['', '', 'Circular Zion logo medallion'],
    ['', '', 'Charcoal, gold, cream branded export workbook'],
    [],
    [],
  ];
}

function worksheetXml(sheet: ExportSheet, sheetIndex: number, hasLogo: boolean) {
  const hasBrandHeader = sheetIndex === 0;
  const columns = sheet.columns ?? [];
  const rows = [
    ...(hasBrandHeader ? brandRows() : []),
    ...(columns.length ? [columns.map((column) => column.header)] : []),
    ...sheet.rows,
  ];
  const headerRowIndex = columns.length ? (hasBrandHeader ? BRAND_ROW_COUNT + 1 : 1) : null;
  const maxColumns = Math.max(
    hasBrandHeader ? 7 : 1,
    columns.length,
    ...rows.map((row) => row.length),
  );
  const lastCell = `${columnName(maxColumns - 1)}${Math.max(rows.length, 1)}`;
  const cols = Array.from({ length: maxColumns }, (_, index) => {
    const width = hasBrandHeader && index < 2
      ? 13
      : columns[index]?.width ?? 18;
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join('');
  const sheetRows = rows.map((row, rowIndex) => {
    const excelRowIndex = rowIndex + 1;
    const brandHeight = hasBrandHeader && excelRowIndex <= BRAND_ROW_COUNT
      ? [22, 19, 17, 8, 8][excelRowIndex - 1]
      : undefined;
    const rowAttributes = brandHeight
      ? ` ht="${brandHeight}" customHeight="1"`
      : '';
    const cells = Array.from({ length: maxColumns }, (_, columnIndex) => (
      xlsxCell(
        row[columnIndex],
        excelRowIndex,
        columnIndex,
        columns[columnIndex]?.type,
        headerRowIndex,
        hasBrandHeader,
      )
    )).join('');

    return `<row r="${excelRowIndex}"${rowAttributes}>${cells}</row>`;
  }).join('');
  const freeze = sheet.freezeHeader && rows.length > 1 && headerRowIndex
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRowIndex}" topLeftCell="A${headerRowIndex + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  const autoFilter = columns.length && rows.length > 1 && headerRowIndex
    ? `<autoFilter ref="A${headerRowIndex}:${lastCell}"/>`
    : '';
  const drawing = hasBrandHeader && hasLogo ? '<drawing r:id="rId1"/>' : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${freeze}
  <cols>${cols}</cols>
  <sheetData>${sheetRows}</sheetData>
  ${autoFilter}
  ${drawing}
</worksheet>`;
}

function workbookXml(sheets: ExportSheet[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((sheet, index) => (
      `<sheet name="${escapeXml(sanitizeSheetName(sheet.name, `Sheet ${index + 1}`))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )).join('')}
  </sheets>
</workbook>`;
}

function workbookRelsXml(sheets: ExportSheet[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  )).join('')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function summarySheetRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`;
}

function drawingRelsXml(logo: WorkbookLogo) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/zionlogo.${logo.extension}"/>
</Relationships>`;
}

function oneCellAnchorXml({
  row,
  col,
  rowOffset,
  colOffset,
  width,
  height,
  body,
}: {
  row: number;
  col: number;
  rowOffset: number;
  colOffset: number;
  width: number;
  height: number;
  body: string;
}) {
  return `<xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>${col}</xdr:col>
      <xdr:colOff>${emu(colOffset)}</xdr:colOff>
      <xdr:row>${row}</xdr:row>
      <xdr:rowOff>${emu(rowOffset)}</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="${emu(width)}" cy="${emu(height)}"/>
    ${body}
    <xdr:clientData/>
  </xdr:oneCellAnchor>`;
}

function drawingXml() {
  const logoSize = emu(58);
  const medallion = oneCellAnchorXml({
    row: 0,
    col: 0,
    rowOffset: 6,
    colOffset: 8,
    width: 86,
    height: 86,
    body: `<xdr:sp macro="">
      <xdr:nvSpPr>
        <xdr:cNvPr id="2" name="Zion circular medallion"/>
        <xdr:cNvSpPr/>
      </xdr:nvSpPr>
      <xdr:spPr>
        <a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="FFFDF5"/></a:solidFill>
        <a:ln w="19050">
          <a:solidFill><a:srgbClr val="D6B53B"/></a:solidFill>
        </a:ln>
      </xdr:spPr>
      <xdr:txBody>
        <a:bodyPr/>
        <a:lstStyle/>
        <a:p><a:endParaRPr lang="en-US"/></a:p>
      </xdr:txBody>
    </xdr:sp>`,
  });
  const logo = oneCellAnchorXml({
    row: 0,
    col: 0,
    rowOffset: 20,
    colOffset: 22,
    width: 58,
    height: 58,
    body: `<xdr:pic>
      <xdr:nvPicPr>
        <xdr:cNvPr id="3" name="Zion Events Place logo"/>
        <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
      </xdr:nvPicPr>
      <xdr:blipFill>
        <a:blip r:embed="rId1"/>
        <a:stretch><a:fillRect/></a:stretch>
      </xdr:blipFill>
      <xdr:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="${logoSize}" cy="${logoSize}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      </xdr:spPr>
    </xdr:pic>`,
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${medallion}
  ${logo}
</xdr:wsDr>`;
}

function contentTypesXml(sheets: ExportSheet[], logo: WorkbookLogo | null) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${logo ? `<Default Extension="${logo.extension}" ContentType="${logo.contentType}"/>` : ''}
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${logo ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}
  ${sheets.map((_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('')}
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="yyyy-mm-dd"/>
    <numFmt numFmtId="165" formatCode="yyyy-mm-dd h:mm"/>
    <numFmt numFmtId="166" formatCode="&quot;PHP&quot; #,##0.00"/>
  </numFmts>
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF1A1F18"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="FF1A1F18"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font>
    <font><b/><sz val="18"/><color rgb="FFD6B53B"/><name val="Georgia"/></font>
    <font><sz val="10"/><color rgb="FF6D7566"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1A1F18"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFDF5CC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD6B53B"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFE8D99B"/></left><right style="thin"><color rgb="FFE8D99B"/></right><top style="thin"><color rgb="FFE8D99B"/></top><bottom style="thin"><color rgb="FFE8D99B"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="1" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>
  </cellXfs>
</styleSheet>`;
}

export function createXlsx(sheets: ExportSheet[]) {
  const safeSheets = sheets.length ? sheets : [{ name: 'Export', rows: [['No records']] }];
  const logo = getZionLogo();
  const hasLogo = Boolean(logo);
  const files: XlsxFile[] = [
    { name: '[Content_Types].xml', content: contentTypesXml(safeSheets, logo) },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    { name: 'xl/workbook.xml', content: workbookXml(safeSheets) },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml(safeSheets) },
    { name: 'xl/styles.xml', content: stylesXml() },
    ...(hasLogo ? [
      { name: 'xl/worksheets/_rels/sheet1.xml.rels', content: summarySheetRelsXml() },
      { name: 'xl/drawings/drawing1.xml', content: drawingXml() },
      { name: 'xl/drawings/_rels/drawing1.xml.rels', content: drawingRelsXml(logo as WorkbookLogo) },
      { name: `xl/media/zionlogo.${(logo as WorkbookLogo).extension}`, content: (logo as WorkbookLogo).data },
    ] : []),
    ...safeSheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet, index, hasLogo),
    })),
  ];

  return createZip(files);
}
