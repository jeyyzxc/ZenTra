export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'print';

export type ExportScope = 'filtered' | 'selected' | 'all' | 'single';

export type ExportRequest = {
  format: ExportFormat;
  scope: ExportScope;
  ids?: string[];
  filters?: Record<string, string>;
  timeZone?: string;
};

export type ExportResult = {
  body: BodyInit;
  contentType: string;
  filename: string;
  exportedRecords: number;
  limitApplied?: boolean;
};

export type ExportColumn<T> = {
  header: string;
  key: string;
  width?: number;
  type?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean';
  value: (row: T) => string | number | boolean | Date | null | undefined;
};

export type ExportSheet = {
  name: string;
  columns?: Array<{
    header: string;
    width?: number;
    type?: ExportColumn<unknown>['type'];
  }>;
  rows: Array<Array<string | number | boolean | Date | null | undefined>>;
  freezeHeader?: boolean;
};

