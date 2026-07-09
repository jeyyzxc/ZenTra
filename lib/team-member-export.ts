import type { Role, UserStatus } from '@prisma/client';
import { composeAdminAddress, type AdminAddressInput } from '@/lib/admin-address-options';
import { createCsv } from '@/lib/export/csv';
import { createXlsx } from '@/lib/export/spreadsheet';
import type { ExportColumn, ExportSheet } from '@/lib/export/types';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';

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

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: Date | string | null, timeZone?: string) {
  const date = toDate(value);

  if (!date) {
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

const TEAM_MEMBER_EXPORT_COLUMNS: Array<ExportColumn<TeamMemberExportRecord>> = [
  { header: 'Team Member ID', key: 'id', width: 28, value: (member) => member.id },
  { header: 'Name', key: 'name', width: 26, value: (member) => displayName(member) },
  { header: 'Username', key: 'username', width: 22, value: (member) => member.username },
  { header: 'Email Address', key: 'email', width: 32, value: (member) => member.email },
  { header: 'Contact Number', key: 'contactNumber', width: 18, value: (member) => text(member.contactNumber) },
  { header: 'Role', key: 'role', width: 16, value: (member) => formatEnum(member.role) },
  { header: 'Status', key: 'status', width: 24, value: (member) => formatEnum(member.status) },
  { header: 'Address', key: 'address', width: 42, value: (member) => composeAdminAddress(member) },
  { header: 'Region', key: 'addressRegion', width: 26, value: (member) => text(member.addressRegion) },
  { header: 'Province', key: 'addressProvince', width: 24, value: (member) => text(member.addressProvince) },
  { header: 'City / Municipality', key: 'addressCity', width: 24, value: (member) => text(member.addressCity) },
  { header: 'Barangay', key: 'addressBarangay', width: 24, value: (member) => text(member.addressBarangay) },
  { header: 'Profile Image', key: 'profileImage', width: 48, value: (member) => text(member.profileImage) },
  {
    header: 'Password Change Required',
    key: 'mustChangePassword',
    type: 'boolean',
    width: 24,
    value: (member) => member.mustChangePassword,
  },
  {
    header: 'Last Password Changed',
    key: 'lastPasswordChangedAt',
    type: 'datetime',
    width: 24,
    value: (member) => toDate(member.lastPasswordChangedAt),
  },
  { header: 'Created By', key: 'createdByName', width: 26, value: (member) => text(member.createdByName) },
  {
    header: 'Created At',
    key: 'createdAt',
    type: 'datetime',
    width: 24,
    value: (member) => toDate(member.createdAt),
  },
  {
    header: 'Updated At',
    key: 'updatedAt',
    type: 'datetime',
    width: 24,
    value: (member) => toDate(member.updatedAt),
  },
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

function rowsFor(members: TeamMemberExportRecord[]) {
  return normalizeTeamMemberExportRecords(members).map((member) => (
    TEAM_MEMBER_EXPORT_COLUMNS.map((column) => column.value(member))
  ));
}

function countBy(records: TeamMemberExportRecord[], value: (member: TeamMemberExportRecord) => string) {
  const counts = new Map<string, number>();

  for (const record of records) {
    const key = value(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort(([first], [second]) => first.localeCompare(second));
}

export function createTeamMemberCsv(
  members: TeamMemberExportRecord[],
) {
  return createCsv(TEAM_MEMBER_EXPORT_COLUMNS, normalizeTeamMemberExportRecords(members));
}

export function createTeamMemberXlsx(
  members: TeamMemberExportRecord[],
  timeZone?: string,
  generatedBy = 'Zion Super Admin',
) {
  const records = normalizeTeamMemberExportRecords(members);
  const summaryRows = [
    ['Zion Events Place - Team Management Export'],
    ['Generated At', formatDateTime(new Date().toISOString(), timeZone)],
    ['Generated By', generatedBy],
    ['Scope', 'All authorized team members'],
    ['Records', records.length],
    ['Filters', 'Super Admin directory export'],
  ];
  const accessRows = [
    ...countBy(records, (member) => formatEnum(member.role)).map(([role, count]) => ['Role', role, count]),
    ...countBy(records, (member) => formatEnum(member.status)).map(([status, count]) => ['Status', status, count]),
    ['Security', 'Password Change Required', records.filter((member) => member.mustChangePassword).length],
    ['Security', 'Password Change Not Required', records.filter((member) => !member.mustChangePassword).length],
  ];
  const appliedFilterRows = [
    ['Scope', 'All authorized team members'],
    ['Authorization', 'Super Admin only'],
    ['Included Roles', 'Super Admin | Admin'],
  ];
  const sheets: ExportSheet[] = [
    { name: 'Summary', rows: summaryRows },
    {
      name: 'Team Members',
      columns: TEAM_MEMBER_EXPORT_COLUMNS.map((column) => ({
        header: column.header,
        width: column.width,
        type: column.type,
      })),
      rows: rowsFor(records),
      freezeHeader: true,
    },
    {
      name: 'Access Overview',
      columns: [
        { header: 'Category', width: 22 },
        { header: 'Metric', width: 34 },
        { header: 'Count', type: 'number', width: 14 },
      ],
      rows: accessRows,
      freezeHeader: true,
    },
    {
      name: 'Applied Filters',
      columns: [
        { header: 'Filter', width: 28 },
        { header: 'Value', width: 48 },
      ],
      rows: appliedFilterRows,
      freezeHeader: true,
    },
  ];

  return createXlsx(sheets);
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
