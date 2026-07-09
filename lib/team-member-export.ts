import { composeAdminAddress, type AdminAddressInput } from '@/lib/admin-address-options';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';
import type { Role, UserStatus } from '@prisma/client';

export type TeamMemberExportRecord = AdminAddressInput & {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  contactNumber: string | null;
  profileImage: string | null;
  role: Role;
  status: UserStatus;
  mustChangePassword: boolean;
  lastPasswordChangedAt: Date | string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type TeamMemberExportFormat = 'csv' | 'excel' | 'pdf';

type TeamMemberExportColumn = {
  heading: string;
  width: number;
  value: (member: TeamMemberExportRecord, timeZone?: string) => string;
};

function text(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function displayName(member: Pick<TeamMemberExportRecord, 'fullName' | 'email'>) {
  return text(member.fullName) || member.email;
}

function formatBoolean(value: boolean) {
  return value ? 'Yes' : 'No';
}

function formatEnum(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: Date | string | null, timeZone?: string) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (!timeZone) {
    return date.toISOString();
  }

  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

const TEAM_MEMBER_EXPORT_COLUMNS: readonly TeamMemberExportColumn[] = [
  { heading: 'Team Member ID', width: 28, value: (member) => member.id },
  { heading: 'Name', width: 26, value: (member) => displayName(member) },
  { heading: 'Username', width: 22, value: (member) => member.username },
  { heading: 'Email Address', width: 32, value: (member) => member.email },
  { heading: 'Contact Number', width: 18, value: (member) => text(member.contactNumber) },
  { heading: 'Role', width: 16, value: (member) => formatEnum(member.role) },
  { heading: 'Status', width: 24, value: (member) => formatEnum(member.status) },
  { heading: 'Address', width: 42, value: (member) => composeAdminAddress(member) },
  { heading: 'Region', width: 26, value: (member) => text(member.addressRegion) },
  { heading: 'Province', width: 24, value: (member) => text(member.addressProvince) },
  { heading: 'City / Municipality', width: 24, value: (member) => text(member.addressCity) },
  { heading: 'Barangay', width: 24, value: (member) => text(member.addressBarangay) },
  { heading: 'Profile Image', width: 48, value: (member) => text(member.profileImage) },
  {
    heading: 'Password Change Required',
    width: 24,
    value: (member) => formatBoolean(member.mustChangePassword),
  },
  {
    heading: 'Last Password Changed',
    width: 24,
    value: (member, timeZone) => formatDateTime(member.lastPasswordChangedAt, timeZone),
  },
  { heading: 'Created By', width: 26, value: (member) => text(member.createdByName) },
  { heading: 'Created At', width: 24, value: (member, timeZone) => formatDateTime(member.createdAt, timeZone) },
  { heading: 'Updated At', width: 24, value: (member, timeZone) => formatDateTime(member.updatedAt, timeZone) },
];

export function normalizeTeamMemberExportRecords(members: TeamMemberExportRecord[]) {
  const seen = new Set<string>();
  const uniqueMembers: TeamMemberExportRecord[] = [];

  for (const member of members) {
    if (seen.has(member.id)) {
      continue;
    }

    seen.add(member.id);
    uniqueMembers.push(member);
  }

  return uniqueMembers;
}

function toRows(members: TeamMemberExportRecord[], timeZone?: string) {
  return normalizeTeamMemberExportRecords(members).map((member) => (
    TEAM_MEMBER_EXPORT_COLUMNS.map((column) => column.value(member, timeZone))
  ));
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function createTeamMemberCsv(
  members: TeamMemberExportRecord[],
  timeZone?: string,
) {
  const rows = toRows(members, timeZone);

  return [
    TEAM_MEMBER_EXPORT_COLUMNS.map((column) => csvCell(column.heading)).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\r\n');
}

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

function xlsxCell(value: string, rowIndex: number, columnIndex: number, styleIndex = 0) {
  const reference = `${columnName(columnIndex)}${rowIndex}`;

  return `<c r="${reference}" s="${styleIndex}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

export function createTeamMemberXlsx(
  members: TeamMemberExportRecord[],
  timeZone?: string,
) {
  const records = normalizeTeamMemberExportRecords(members);
  const generatedAt = formatDateTime(new Date().toISOString(), timeZone);
  const reportRows = [
    ['Zentra Team Members Export'],
    [`Generated: ${generatedAt}`],
    [`Records: ${records.length}`],
    [],
    TEAM_MEMBER_EXPORT_COLUMNS.map((column) => column.heading),
    ...toRows(records, timeZone),
  ];
  const sheetRows = reportRows
    .map((row, rowIndex) => {
      const excelRowIndex = rowIndex + 1;
      const styleIndex = rowIndex === 0 ? 1 : rowIndex === 1 || rowIndex === 2 ? 2 : rowIndex === 4 ? 3 : 0;
      const cells = row
        .map((value, columnIndex) => xlsxCell(value, excelRowIndex, columnIndex, styleIndex))
        .join('');

      return `<row r="${excelRowIndex}">${cells}</row>`;
    })
    .join('');
  const columns = TEAM_MEMBER_EXPORT_COLUMNS
    .map((column, index) => (
      `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`
    ))
    .join('');
  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>${columns}</cols>
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
    <sheet name="Team Members" sheetId="1" r:id="rId1"/>
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
  <fonts count="4">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="FF1A1F18"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD6B53B"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFDF5CC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFE8D99B"/></left><right style="thin"><color rgb="FFE8D99B"/></right><top style="thin"><color rgb="FFE8D99B"/></top><bottom style="thin"><color rgb="FFE8D99B"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="3" fillId="1" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheet,
    },
  ]);
}

export function createTeamMemberPdf(
  members: TeamMemberExportRecord[],
  timeZone?: string,
) {
  const records = normalizeTeamMemberExportRecords(members);
  const columns: Array<ZionPdfColumn<TeamMemberExportRecord>> = [
    {
      header: 'Member',
      width: 106,
      maxLines: 4,
      value: (member) => [
        displayName(member),
        `Username: ${member.username}`,
        `ID: ${member.id}`,
      ].join(' | '),
    },
    {
      header: 'Contact',
      width: 136,
      maxLines: 5,
      value: (member) => [
        member.email,
        `Phone: ${text(member.contactNumber) || 'Not provided'}`,
        `Profile: ${text(member.profileImage) || 'Not provided'}`,
      ].join(' | '),
    },
    {
      header: 'Role',
      width: 58,
      maxLines: 2,
      value: (member) => formatEnum(member.role),
    },
    {
      header: 'Status',
      width: 66,
      align: 'center',
      maxLines: 2,
      value: (member) => formatEnum(member.status),
    },
    {
      header: 'Details',
      width: 190,
      maxLines: 9,
      value: (member) => {
        const lastPasswordChanged = formatDateTime(member.lastPasswordChangedAt, timeZone) || 'Not available';
        const address = composeAdminAddress(member) || 'Not provided';
        const createdBy = text(member.createdByName) || 'System or unavailable';

        return [
          `Address: ${address}`,
          `Password change required: ${formatBoolean(member.mustChangePassword)}`,
          `Last password changed: ${lastPasswordChanged}`,
          `Created by: ${createdBy}`,
          `Created: ${formatDateTime(member.createdAt, timeZone)}`,
          `Updated: ${formatDateTime(member.updatedAt, timeZone)}`,
        ].join(' | ');
      },
    },
  ];

  return createZionBrandedTablePdf({
    title: 'Team Management Export',
    subtitle: 'A branded and confidential team access export from Team Management.',
    badge: 'Admin Directory',
    generatedAt: formatDateTime(new Date().toISOString(), timeZone),
    recordCount: records.length,
    rows: records,
    columns,
    emptyMessage: 'No team member records are available for export.',
    footerLabel: 'Confidential team management export - Zion Events Place',
  });
}

export function getTeamMemberExportFilename(extension = 'csv') {
  const date = new Date().toISOString().slice(0, 10);
  return `zentra-team-members-${date}.${extension}`;
}
