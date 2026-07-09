import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

type PdfColor = [number, number, number];

export type ZionPdfColumn<T> = {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  maxLines?: number;
  value: (row: T) => string;
};

export type ZionPdfInput<T> = {
  title: string;
  subtitle: string;
  badge: string;
  generatedAt: string;
  recordCount: number;
  rows: T[];
  columns: Array<ZionPdfColumn<T>>;
  emptyMessage?: string;
  footerLabel?: string;
};

type LogoImage = {
  kind: 'jpeg' | 'png';
  data: Buffer;
  alpha?: Buffer;
  width: number;
  height: number;
};

type PreparedCell = {
  lines: string[];
  align: 'left' | 'center' | 'right';
  header: string;
  width: number;
};

type PreparedRow = {
  cells: PreparedCell[];
  height: number;
};

type PdfObject = {
  id: number;
  content: Uint8Array[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 28;
const TABLE_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const TABLE_TOP = 618;
const TABLE_HEADER_HEIGHT = 24;
const FOOTER_Y = 30;
const BOTTOM_Y = 58;
const ROW_FONT_SIZE = 7.1;
const ROW_LINE_HEIGHT = 8.8;
const ROW_TEXT_WIDTH_RATIO = 0.56;
const ROW_PADDING_X = 5;
const ROW_PADDING_Y = 5;
const MIN_ROW_HEIGHT = 24;

const COLORS = {
  charcoal: [0.102, 0.122, 0.094] as PdfColor,
  charcoalSoft: [0.19, 0.22, 0.18] as PdfColor,
  gold: [0.839, 0.71, 0.231] as PdfColor,
  goldDark: [0.557, 0.467, 0.133] as PdfColor,
  cream: [0.992, 0.961, 0.8] as PdfColor,
  paper: [1, 0.992, 0.957] as PdfColor,
  white: [1, 1, 1] as PdfColor,
  sage: [0.639, 0.694, 0.608] as PdfColor,
  muted: [0.39, 0.42, 0.36] as PdfColor,
  line: [0.91, 0.85, 0.61] as PdfColor,
  success: [0.047, 0.49, 0.278] as PdfColor,
  warning: [0.69, 0.42, 0.035] as PdfColor,
  failed: [0.7, 0.12, 0.12] as PdfColor,
};

const encoder = new TextEncoder();
let logoCache: LogoImage | null | undefined;

function encode(value: string) {
  return encoder.encode(value);
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

function num(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function color([r, g, b]: PdfColor, op: 'rg' | 'RG' = 'rg') {
  return `${num(r)} ${num(g)} ${num(b)} ${op}`;
}

function rect(x: number, y: number, width: number, height: number, fill: PdfColor) {
  return `${color(fill)}\n${num(x)} ${num(y)} ${num(width)} ${num(height)} re f`;
}

function strokeRect(x: number, y: number, width: number, height: number, stroke: PdfColor, lineWidth = 0.6) {
  return `${color(stroke, 'RG')}\n${num(lineWidth)} w\n${num(x)} ${num(y)} ${num(width)} ${num(height)} re S`;
}

function line(x1: number, y1: number, x2: number, y2: number, stroke: PdfColor, lineWidth = 0.6) {
  return `${color(stroke, 'RG')}\n${num(lineWidth)} w\n${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`;
}

function circlePath(cx: number, cy: number, radius: number) {
  const c = radius * 0.5522847498;

  return [
    `${num(cx)} ${num(cy + radius)} m`,
    `${num(cx + c)} ${num(cy + radius)} ${num(cx + radius)} ${num(cy + c)} ${num(cx + radius)} ${num(cy)} c`,
    `${num(cx + radius)} ${num(cy - c)} ${num(cx + c)} ${num(cy - radius)} ${num(cx)} ${num(cy - radius)} c`,
    `${num(cx - c)} ${num(cy - radius)} ${num(cx - radius)} ${num(cy - c)} ${num(cx - radius)} ${num(cy)} c`,
    `${num(cx - radius)} ${num(cy + c)} ${num(cx - c)} ${num(cy + radius)} ${num(cx)} ${num(cy + radius)} c`,
    'h',
  ].join('\n');
}

function circle(cx: number, cy: number, radius: number, fill: PdfColor, stroke?: PdfColor, lineWidth = 0.6) {
  const strokeCommands = stroke
    ? `${color(stroke, 'RG')}\n${num(lineWidth)} w\n`
    : '';
  const operation = stroke ? 'B' : 'f';

  return `${color(fill)}\n${strokeCommands}${circlePath(cx, cy, radius)} ${operation}`;
}

function strokeCircle(cx: number, cy: number, radius: number, stroke: PdfColor, lineWidth = 0.6) {
  return `${color(stroke, 'RG')}\n${num(lineWidth)} w\n${circlePath(cx, cy, radius)} S`;
}

function clippedImage(resourceName: string, cx: number, cy: number, clipRadius: number, size: number) {
  return [
    'q',
    `${circlePath(cx, cy, clipRadius)} W n`,
    `${num(size)} 0 0 ${num(size)} ${num(cx - size / 2)} ${num(cy - size / 2)} cm`,
    `/${resourceName} Do`,
    'Q',
  ].join('\n');
}

function escapePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7e]/g, '?')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function normalizeText(value: string) {
  return value
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function textCommand({
  x,
  y,
  text,
  font = 'F1',
  size,
  fill = COLORS.charcoal,
}: {
  x: number;
  y: number;
  text: string;
  font?: 'F1' | 'F2';
  size: number;
  fill?: PdfColor;
}) {
  return [
    'BT',
    `/${font} ${num(size)} Tf`,
    color(fill),
    `${num(x)} ${num(y)} Td`,
    `(${escapePdfText(text)}) Tj`,
    'ET',
  ].join('\n');
}

function splitLongWord(word: string, maxChars: number) {
  const chunks: string[] = [];
  let remaining = word;

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars + 1);
    const naturalBreak = Math.max(
      window.lastIndexOf('/'),
      window.lastIndexOf('.'),
      window.lastIndexOf('-'),
      window.lastIndexOf('@'),
      window.lastIndexOf('_'),
    );
    const splitAt = naturalBreak >= Math.floor(maxChars * 0.55)
      ? naturalBreak + 1
      : maxChars;

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function wrapText(value: string, width: number, maxLines: number) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [''];
  }

  const maxChars = Math.max(8, Math.floor((width - ROW_PADDING_X * 2) / (ROW_FONT_SIZE * ROW_TEXT_WIDTH_RATIO)));
  const words = normalized.split(' ').flatMap((word) => (
    word.length > maxChars ? splitLongWord(word, maxChars) : [word]
  ));
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`;
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  if (words.join(' ').length > lines.join(' ').length && lines.length === maxLines) {
    const last = lines[lines.length - 1] ?? '';
    lines[lines.length - 1] = last.length > 3
      ? `${last.slice(0, Math.max(0, maxChars - 3))}...`
      : last;
  }

  return lines.length ? lines : [''];
}

function getJpegDimensions(data: Buffer) {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (data[offset] === 0xff) {
      offset += 1;
    }

    const marker = data[offset];
    offset += 1;

    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    if (offset + 2 > data.length) {
      break;
    }

    const segmentLength = data.readUInt16BE(offset);

    if (sofMarkers.has(marker) && offset + 7 < data.length) {
      return {
        height: data.readUInt16BE(offset + 3),
        width: data.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function paethPredictor(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function unfilterPngScanlines(data: Buffer, width: number, height: number, bytesPerPixel: number) {
  const stride = width * bytesPerPixel;
  const output = Buffer.alloc(stride * height);
  let sourceOffset = 0;

  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    const filter = data[sourceOffset];
    sourceOffset += 1;
    const rowOffset = rowIndex * stride;
    const previousRowOffset = rowOffset - stride;

    for (let column = 0; column < stride; column += 1) {
      const raw = data[sourceOffset + column];
      const left = column >= bytesPerPixel ? output[rowOffset + column - bytesPerPixel] : 0;
      const up = rowIndex > 0 ? output[previousRowOffset + column] : 0;
      const upLeft = rowIndex > 0 && column >= bytesPerPixel
        ? output[previousRowOffset + column - bytesPerPixel]
        : 0;
      let value = raw;

      if (filter === 1) value = raw + left;
      if (filter === 2) value = raw + up;
      if (filter === 3) value = raw + Math.floor((left + up) / 2);
      if (filter === 4) value = raw + paethPredictor(left, up, upLeft);

      output[rowOffset + column] = value & 0xff;
    }

    sourceOffset += stride;
  }

  return output;
}

function parsePngLogo(data: Buffer): LogoImage | null {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  if (data.length < 33 || !data.subarray(0, 8).equals(signature)) {
    return null;
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString('ascii');
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
    }

    if (type === 'IDAT') {
      idatChunks.push(Buffer.from(chunk));
    }

    if (type === 'IEND') {
      break;
    }
  }

  if (!width || !height || bitDepth !== 8 || ![2, 6].includes(colorType) || idatChunks.length === 0) {
    return null;
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const unfiltered = unfilterPngScanlines(inflated, width, height, bytesPerPixel);
  const pixelCount = width * height;
  const rgb = Buffer.alloc(pixelCount * 3);
  const alpha = colorType === 6 ? Buffer.alloc(pixelCount) : undefined;

  for (let index = 0; index < pixelCount; index += 1) {
    const source = index * bytesPerPixel;
    const target = index * 3;

    rgb[target] = unfiltered[source];
    rgb[target + 1] = unfiltered[source + 1];
    rgb[target + 2] = unfiltered[source + 2];

    if (alpha) {
      alpha[index] = unfiltered[source + 3];
    }
  }

  return {
    kind: 'png',
    data: zlib.deflateSync(rgb),
    alpha: alpha ? zlib.deflateSync(alpha) : undefined,
    width,
    height,
  };
}

function getLogoImage() {
  if (logoCache !== undefined) {
    return logoCache;
  }

  const pngPath = path.join(process.cwd(), 'public', 'zion-logo.png');

  try {
    logoCache = parsePngLogo(fs.readFileSync(pngPath));

    if (logoCache) {
      return logoCache;
    }
  } catch {
    logoCache = null;
  }

  const jpegPath = path.join(process.cwd(), 'public', 'zion', 'zionlogo.jpg');

  try {
    const data = fs.readFileSync(jpegPath);
    const dimensions = getJpegDimensions(data);

    logoCache = dimensions
      ? {
          kind: 'jpeg',
          data,
          width: dimensions.width,
          height: dimensions.height,
        }
      : null;
  } catch {
    logoCache = null;
  }

  return logoCache;
}

function prepareRows<T>(rows: T[], columns: Array<ZionPdfColumn<T>>) {
  return rows.map<PreparedRow>((row) => {
    const cells = columns.map<PreparedCell>((column) => {
      const lines = wrapText(column.value(row), column.width, column.maxLines ?? 3);

      return {
        lines,
        align: column.align ?? 'left',
        header: column.header,
        width: column.width,
      };
    });
    const maxLines = Math.max(...cells.map((cell) => cell.lines.length), 1);

    return {
      cells,
      height: Math.max(MIN_ROW_HEIGHT, ROW_PADDING_Y * 2 + maxLines * ROW_LINE_HEIGHT),
    };
  });
}

function paginateRows(rows: PreparedRow[]) {
  if (rows.length === 0) {
    return [[]];
  }

  const pages: PreparedRow[][] = [];
  let currentPage: PreparedRow[] = [];
  let y = TABLE_TOP - TABLE_HEADER_HEIGHT;

  for (const row of rows) {
    if (currentPage.length > 0 && y - row.height < BOTTOM_Y) {
      pages.push(currentPage);
      currentPage = [];
      y = TABLE_TOP - TABLE_HEADER_HEIGHT;
    }

    currentPage.push(row);
    y -= row.height;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function rowStatusColor(value: string) {
  const normalized = value.toUpperCase();

  if (normalized.includes('FAILED') || normalized.includes('ERROR') || normalized.includes('BOUNCED')) {
    return COLORS.failed;
  }

  if (normalized.includes('WARNING') || normalized.includes('PENDING') || normalized.includes('QUEUED')) {
    return COLORS.warning;
  }

  if (normalized.includes('SUCCESS') || normalized.includes('SENT') || normalized.includes('DELIVERED')) {
    return COLORS.success;
  }

  return COLORS.charcoal;
}

function renderHeader<T>(input: ZionPdfInput<T>, pageNumber: number) {
  const commands = [
    rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, COLORS.paper),
    rect(0, 660, PAGE_WIDTH, 132, COLORS.charcoal),
    rect(0, 660, PAGE_WIDTH, 5, COLORS.gold),
    rect(0, 646, PAGE_WIDTH, 14, COLORS.cream),
    textCommand({
      x: 34,
      y: 755,
      text: 'ZION EVENTS PLACE',
      font: 'F2',
      size: 10,
      fill: COLORS.gold,
    }),
    textCommand({
      x: 34,
      y: 731,
      text: input.title,
      font: 'F2',
      size: 20,
      fill: COLORS.white,
    }),
    textCommand({
      x: 34,
      y: 713,
      text: input.subtitle,
      size: 9.5,
      fill: COLORS.sage,
    }),
    rect(34, 679, 132, 23, COLORS.charcoalSoft),
    strokeRect(34, 679, 132, 23, COLORS.gold, 0.5),
    textCommand({
      x: 44,
      y: 687,
      text: input.badge,
      font: 'F2',
      size: 8,
      fill: COLORS.cream,
    }),
    rect(176, 679, 152, 23, COLORS.charcoalSoft),
    strokeRect(176, 679, 152, 23, COLORS.gold, 0.5),
    textCommand({
      x: 186,
      y: 687,
      text: `Records: ${input.recordCount}`,
      font: 'F2',
      size: 8,
      fill: COLORS.cream,
    }),
    rect(338, 679, 130, 23, COLORS.charcoalSoft),
    strokeRect(338, 679, 130, 23, COLORS.gold, 0.5),
    textCommand({
      x: 348,
      y: 687,
      text: `Page ${pageNumber}`,
      font: 'F2',
      size: 8,
      fill: COLORS.cream,
    }),
    textCommand({
      x: 34,
      y: 633,
      text: `Generated ${input.generatedAt}`,
      size: 8,
      fill: COLORS.goldDark,
    }),
  ];
  const logo = getLogoImage();

  if (logo) {
    const centerX = 541;
    const centerY = 723;
    const logoSize = logo.kind === 'png' ? 51 : 49;

    commands.push(
      circle(centerX + 2.4, centerY - 2.4, 40, COLORS.charcoalSoft),
      circle(centerX, centerY, 40, COLORS.gold),
      circle(centerX, centerY, 36.3, COLORS.white),
      clippedImage('Logo', centerX, centerY, 32, logoSize),
      strokeCircle(centerX, centerY, 36.3, COLORS.line, 0.35),
    );
  } else {
    commands.push(
      circle(541, 723, 39, COLORS.white, COLORS.gold, 1.2),
      textCommand({
        x: 521,
        y: 724,
        text: 'ZION',
        font: 'F2',
        size: 17,
        fill: COLORS.gold,
      }),
    );
  }

  return commands;
}

function renderTableHeader<T>(columns: Array<ZionPdfColumn<T>>) {
  const commands = [
    rect(MARGIN_X, TABLE_TOP - TABLE_HEADER_HEIGHT, TABLE_WIDTH, TABLE_HEADER_HEIGHT, COLORS.charcoal),
    strokeRect(MARGIN_X, TABLE_TOP - TABLE_HEADER_HEIGHT, TABLE_WIDTH, TABLE_HEADER_HEIGHT, COLORS.gold, 0.7),
  ];
  let x = MARGIN_X;

  for (const column of columns) {
    commands.push(textCommand({
      x: x + ROW_PADDING_X,
      y: TABLE_TOP - 15,
      text: column.header.toUpperCase(),
      font: 'F2',
      size: 6.8,
      fill: COLORS.gold,
    }));

    if (x > MARGIN_X) {
      commands.push(line(x, TABLE_TOP - TABLE_HEADER_HEIGHT, x, TABLE_TOP, COLORS.gold, 0.35));
    }

    x += column.width;
  }

  return commands;
}

function cellTextX(x: number, width: number, lineValue: string, align: PreparedCell['align']) {
  if (align === 'center') {
    return x + Math.max(ROW_PADDING_X, (width - lineValue.length * ROW_FONT_SIZE * ROW_TEXT_WIDTH_RATIO) / 2);
  }

  if (align === 'right') {
    return x + width - ROW_PADDING_X - lineValue.length * ROW_FONT_SIZE * ROW_TEXT_WIDTH_RATIO;
  }

  return x + ROW_PADDING_X;
}

function renderRow(row: PreparedRow, y: number, rowIndex: number) {
  const commands = [
    rect(MARGIN_X, y, TABLE_WIDTH, row.height, rowIndex % 2 === 0 ? COLORS.white : COLORS.cream),
    strokeRect(MARGIN_X, y, TABLE_WIDTH, row.height, COLORS.line, 0.35),
  ];
  let x = MARGIN_X;

  row.cells.forEach((cell, cellIndex) => {
    if (cellIndex > 0) {
      commands.push(line(x, y, x, y + row.height, COLORS.line, 0.35));
    }

    cell.lines.forEach((lineValue, lineIndex) => {
      const fill = cell.header.toLowerCase().includes('status')
        ? rowStatusColor(lineValue)
        : COLORS.charcoal;

      commands.push(textCommand({
        x: cellTextX(x, cell.width, lineValue, cell.align),
        y: y + row.height - ROW_PADDING_Y - ROW_FONT_SIZE - lineIndex * ROW_LINE_HEIGHT,
        text: lineValue,
        font: cell.header.toLowerCase().includes('status') ? 'F2' : 'F1',
        size: ROW_FONT_SIZE,
        fill,
      }));
    });

    x += cell.width;
  });

  return commands;
}

function renderFooter(
  pageNumber: number,
  totalPages: number,
  footerLabel = 'Confidential system log export - Zion Events Place',
) {
  return [
    line(MARGIN_X, 45, PAGE_WIDTH - MARGIN_X, 45, COLORS.line, 0.45),
    textCommand({
      x: MARGIN_X,
      y: FOOTER_Y,
      text: footerLabel,
      size: 7.5,
      fill: COLORS.muted,
    }),
    textCommand({
      x: PAGE_WIDTH - MARGIN_X - 70,
      y: FOOTER_Y,
      text: `Page ${pageNumber} of ${totalPages}`,
      size: 7.5,
      fill: COLORS.muted,
    }),
  ];
}

function renderEmptyState(message: string) {
  return [
    rect(MARGIN_X, 548, TABLE_WIDTH, 46, COLORS.white),
    strokeRect(MARGIN_X, 548, TABLE_WIDTH, 46, COLORS.line, 0.4),
    textCommand({
      x: MARGIN_X + 16,
      y: 570,
      text: message,
      font: 'F2',
      size: 9.5,
      fill: COLORS.muted,
    }),
  ];
}

function makeObject(id: number, content: Uint8Array[]) {
  return concatBytes([
    encode(`${id} 0 obj\n`),
    ...content,
    encode('\nendobj\n'),
  ]);
}

function buildPdf(objects: PdfObject[]) {
  const sortedObjects = [...objects].sort((first, second) => first.id - second.id);
  const chunks: Uint8Array[] = [encode('%PDF-1.4\n')];
  const offsets: number[] = [0];
  let length = chunks[0].length;
  const maxId = Math.max(...sortedObjects.map((object) => object.id));

  for (const object of sortedObjects) {
    offsets[object.id] = length;
    const objectBytes = makeObject(object.id, object.content);
    chunks.push(objectBytes);
    length += objectBytes.length;
  }

  const xrefOffset = length;
  const xrefLines = [
    `xref\n0 ${maxId + 1}\n`,
    '0000000000 65535 f \n',
  ];

  for (let id = 1; id <= maxId; id += 1) {
    xrefLines.push(`${(offsets[id] ?? 0).toString().padStart(10, '0')} 00000 n \n`);
  }

  xrefLines.push(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  chunks.push(encode(xrefLines.join('')));

  return concatBytes(chunks);
}

export function createZionBrandedTablePdf<T>(input: ZionPdfInput<T>) {
  const preparedRows = prepareRows(input.rows, input.columns);
  const pages = paginateRows(preparedRows);
  const totalPages = pages.length;
  const logo = getLogoImage();
  const objects: PdfObject[] = [
    { id: 1, content: [encode('<< /Type /Catalog /Pages 2 0 R >>')] },
    { id: 3, content: [encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')] },
    { id: 4, content: [encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')] },
  ];
  let nextObjectId = 5;
  let logoObjectId: number | null = null;

  if (logo) {
    let logoMaskObjectId: number | null = null;

    if (logo.kind === 'png' && logo.alpha) {
      logoMaskObjectId = nextObjectId;
      nextObjectId += 1;
      objects.push({
        id: logoMaskObjectId,
        content: [
          encode(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.alpha.length} >>\nstream\n`),
          logo.alpha,
          encode('\nendstream'),
        ],
      });
    }

    logoObjectId = nextObjectId;
    nextObjectId += 1;
    objects.push({
      id: logoObjectId,
      content: [
        encode([
          `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height}`,
          '/ColorSpace /DeviceRGB /BitsPerComponent 8',
          `/Filter /${logo.kind === 'png' ? 'FlateDecode' : 'DCTDecode'}`,
          logoMaskObjectId ? `/SMask ${logoMaskObjectId} 0 R` : '',
          `/Length ${logo.data.length} >>\nstream\n`,
        ].filter(Boolean).join(' ')),
        logo.data,
        encode('\nendstream'),
      ],
    });
  }

  const pageObjectIds: number[] = [];
  const resourceDictionary = [
    '/Font << /F1 3 0 R /F2 4 0 R >>',
    logoObjectId ? `/XObject << /Logo ${logoObjectId} 0 R >>` : '',
  ].filter(Boolean).join(' ');

  pages.forEach((pageRows, pageIndex) => {
    const pageNumber = pageIndex + 1;
    const pageObjectId = nextObjectId;
    const contentObjectId = nextObjectId + 1;
    nextObjectId += 2;
    pageObjectIds.push(pageObjectId);

    const commands = [
      ...renderHeader(input, pageNumber),
      ...renderTableHeader(input.columns),
    ];
    let y = TABLE_TOP - TABLE_HEADER_HEIGHT;

    if (input.rows.length === 0) {
      commands.push(...renderEmptyState(input.emptyMessage ?? 'No records matched the selected filters.'));
    } else {
      pageRows.forEach((row, rowIndex) => {
        y -= row.height;
        commands.push(...renderRow(row, y, pageIndex * 1000 + rowIndex));
      });
    }

    commands.push(...renderFooter(pageNumber, totalPages, input.footerLabel));
    const content = encode(commands.join('\n'));

    objects.push(
      {
        id: pageObjectId,
        content: [encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << ${resourceDictionary} >> /Contents ${contentObjectId} 0 R >>`)],
      },
      {
        id: contentObjectId,
        content: [
          encode(`<< /Length ${content.length} >>\nstream\n`),
          content,
          encode('\nendstream'),
        ],
      },
    );
  });

  objects.push({
    id: 2,
    content: [encode(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`)],
  });

  return buildPdf(objects);
}
