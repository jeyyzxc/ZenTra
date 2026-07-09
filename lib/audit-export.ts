import type { AuditLogDto } from '@/lib/audit-query';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';

export type AuditExportScope = 'all' | 'own';

const SUPERADMIN_EXPORT_COLUMNS = [
  'Timestamp',
  'User',
  'Role',
  'Action',
  'Module',
  'Status',
  'IP Address',
  'Description',
] as const;

const ADMIN_EXPORT_COLUMNS = [
  'Timestamp',
  'Action',
  'Module',
  'Status',
  'Description',
] as const;

type AuditExportColumn =
  | (typeof SUPERADMIN_EXPORT_COLUMNS)[number]
  | (typeof ADMIN_EXPORT_COLUMNS)[number];

type AuditExportRow = Record<AuditExportColumn, string>;

function getExportColumns(scope: AuditExportScope): readonly AuditExportColumn[] {
  return scope === 'own' ? ADMIN_EXPORT_COLUMNS : SUPERADMIN_EXPORT_COLUMNS;
}

function formatTimestamp(timestamp: string, timeZone: string | undefined) {
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone,
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function formatPdfEnum(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toRows(
  logs: AuditLogDto[],
  timeZone: string | undefined,
): AuditExportRow[] {
  return logs.map((log) => ({
    Timestamp: formatTimestamp(log.timestamp, timeZone),
    User: log.userName,
    Role: log.userRole,
    Action: log.action,
    Module: log.module,
    Status: log.status,
    'IP Address': log.ipAddress ?? '',
    Description: log.description,
  }));
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function createAuditCsv(
  logs: AuditLogDto[],
  timeZone?: string,
  scope: AuditExportScope = 'all',
) {
  const columns = getExportColumns(scope);
  const rows = toRows(logs, timeZone);
  return [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ].join('\r\n');
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

function createZip(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
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

export function createAuditXlsx(
  logs: AuditLogDto[],
  timeZone?: string,
  scope: AuditExportScope = 'all',
) {
  const columns = getExportColumns(scope);
  const rows = [columns, ...toRows(logs, timeZone).map((row) => columns.map((column) => row[column]))];
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
          return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
        })
        .join('');

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>
    <col min="1" max="1" width="24" customWidth="1"/>
    <col min="2" max="8" width="18" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;

  return createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${scope === 'own' ? 'My Activity Log' : 'Audit Logs'}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheet,
    },
  ]);
}

export function createAuditPdf(
  logs: AuditLogDto[],
  timeZone?: string,
  scope: AuditExportScope = 'all',
) {
  const rows = toRows(logs, timeZone);
  const columns: Array<ZionPdfColumn<AuditExportRow>> = scope === 'own'
    ? [
        { header: 'Time', width: 84, maxLines: 2, value: (row) => row.Timestamp },
        { header: 'Action', width: 80, maxLines: 2, value: (row) => formatPdfEnum(row.Action) },
        { header: 'Module', width: 70, maxLines: 2, value: (row) => row.Module },
        { header: 'Status', width: 54, align: 'center', maxLines: 1, value: (row) => formatPdfEnum(row.Status) },
        { header: 'Details', width: 268, maxLines: 4, value: (row) => row.Description },
      ]
    : [
        { header: 'Time', width: 72, maxLines: 2, value: (row) => row.Timestamp },
        { header: 'User', width: 74, maxLines: 2, value: (row) => row.User },
        { header: 'Role', width: 62, maxLines: 2, value: (row) => formatPdfEnum(row.Role) },
        { header: 'Action', width: 62, maxLines: 2, value: (row) => formatPdfEnum(row.Action) },
        { header: 'Module', width: 56, maxLines: 2, value: (row) => row.Module },
        { header: 'Status', width: 48, align: 'center', maxLines: 1, value: (row) => formatPdfEnum(row.Status) },
        {
          header: 'Details',
          width: 182,
          maxLines: 4,
          value: (row) => [row.Description, row['IP Address'] ? `IP: ${row['IP Address']}` : '']
            .filter(Boolean)
            .join(' | '),
        },
      ];

  return createZionBrandedTablePdf({
    title: scope === 'own' ? 'My Activity Log' : 'System Audit Logs',
    subtitle: 'A branded and confidential activity export from System Logs.',
    badge: scope === 'own' ? 'Personal Activity' : 'Audit Trail',
    generatedAt: formatTimestamp(new Date().toISOString(), timeZone),
    recordCount: rows.length,
    rows,
    columns,
    emptyMessage: 'No audit log records matched the selected filters.',
  });
}

export function getAuditExportFilename(
  extension: string,
  scope: AuditExportScope = 'all',
) {
  const date = new Date().toISOString().slice(0, 10);
  const prefix = scope === 'own' ? 'zentra-my-activity-log' : 'zentra-audit-logs';
  return `${prefix}-${date}.${extension}`;
}
