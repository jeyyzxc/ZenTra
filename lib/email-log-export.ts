import type { EmailLogDto } from '@/lib/email-log-query';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';

export type EmailLogExportScope = 'all' | 'admin';

const STANDARD_COLUMNS = [
  'Created',
  'Recipient Email',
  'Recipient Name',
  'Email Type',
  'Related Module',
  'Related Record ID',
  'Subject',
  'Trigger Source',
  'Workflow',
  'Status',
  'Retry Count',
  'Last Attempt',
  'Sent',
  'Delivered',
  'Failed',
  'Failure Reason',
  'Error Message',
] as const;

const SUPERADMIN_ONLY_COLUMNS = ['Payload Summary'] as const;

type EmailLogExportColumn =
  | (typeof STANDARD_COLUMNS)[number]
  | (typeof SUPERADMIN_ONLY_COLUMNS)[number];

type EmailLogExportRow = Record<EmailLogExportColumn, string>;

function getColumns(scope: EmailLogExportScope): readonly EmailLogExportColumn[] {
  return scope === 'all'
    ? [...STANDARD_COLUMNS, ...SUPERADMIN_ONLY_COLUMNS]
    : STANDARD_COLUMNS;
}

function formatTimestamp(timestamp: string | null, timeZone: string | undefined) {
  if (!timestamp) {
    return '';
  }

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

function formatEnum(value: string | null) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
}

function stringifyPayload(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toRows(logs: EmailLogDto[], timeZone?: string): EmailLogExportRow[] {
  return logs.map((log) => ({
    Created: formatTimestamp(log.createdAt, timeZone),
    'Recipient Email': log.recipientEmail,
    'Recipient Name': log.recipientName ?? '',
    'Email Type': formatEnum(log.emailType),
    'Related Module': formatEnum(log.relatedModule),
    'Related Record ID': log.relatedRecordId ?? '',
    Subject: log.subject,
    'Trigger Source': formatEnum(log.triggerSource),
    Workflow: log.workflowName ?? '',
    Status: formatEnum(log.status),
    'Retry Count': String(log.retryCount),
    'Last Attempt': formatTimestamp(log.lastAttemptAt, timeZone),
    Sent: formatTimestamp(log.sentAt, timeZone),
    Delivered: formatTimestamp(log.deliveredAt, timeZone),
    Failed: formatTimestamp(log.failedAt, timeZone),
    'Failure Reason': formatEnum(log.failureReason),
    'Error Message': log.errorMessage ?? '',
    'Payload Summary': stringifyPayload(log.payloadSummary),
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

export function createEmailLogCsv(
  logs: EmailLogDto[],
  timeZone?: string,
  scope: EmailLogExportScope = 'all',
) {
  const columns = getColumns(scope);
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

export function createEmailLogXlsx(
  logs: EmailLogDto[],
  timeZone?: string,
  scope: EmailLogExportScope = 'all',
) {
  const columns = getColumns(scope);
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
    <col min="2" max="${columns.length}" width="22" customWidth="1"/>
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
    <sheet name="Email Logs" sheetId="1" r:id="rId1"/>
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

export function createEmailLogPdf(
  logs: EmailLogDto[],
  timeZone?: string,
  scope: EmailLogExportScope = 'all',
) {
  const rows = toRows(logs, timeZone);
  const columns: Array<ZionPdfColumn<EmailLogExportRow>> = [
    { header: 'Created', width: 76, maxLines: 2, value: (row) => row.Created },
    { header: 'Recipient', width: 116, maxLines: 3, value: (row) => row['Recipient Email'] },
    { header: 'Type', width: 78, maxLines: 3, value: (row) => row['Email Type'] },
    { header: 'Source', width: 72, maxLines: 2, value: (row) => row['Trigger Source'] },
    { header: 'Status', width: 54, align: 'center', maxLines: 1, value: (row) => row.Status },
    {
      header: 'Details',
      width: 160,
      maxLines: 4,
      value: (row) => [
        row.Subject,
        row.Workflow ? `Workflow: ${row.Workflow}` : '',
        row['Related Module'] ? `Related: ${row['Related Module']} ${row['Related Record ID']}` : '',
        row['Error Message'] ? `Error: ${row['Error Message']}` : '',
        scope === 'all' && row['Payload Summary'] ? `Payload: ${row['Payload Summary']}` : '',
      ].filter(Boolean).join(' | '),
    },
  ];

  return createZionBrandedTablePdf({
    title: 'Email Delivery Logs',
    subtitle: 'A branded and confidential delivery export from System Logs.',
    badge: scope === 'all' ? 'All Email Activity' : 'Admin Email Activity',
    generatedAt: formatTimestamp(new Date().toISOString(), timeZone),
    recordCount: rows.length,
    rows,
    columns,
    emptyMessage: 'No email log records matched the selected filters.',
  });
}

export function getEmailLogExportFilename(extension: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `zentra-email-logs-${date}.${extension}`;
}
