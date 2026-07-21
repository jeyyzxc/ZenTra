import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const sourceRoots = ['app', 'components'];
const supportedExtensions = new Set(['.css', '.tsx']);
const findings = [];

function walk(directory) {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

function addFinding(path, source, index, message) {
  const line = source.slice(0, index).split('\n').length;
  findings.push(`${relative(root, path)}:${line} ${message}`);
}

for (const sourceRoot of sourceRoots) {
  for (const path of walk(join(root, sourceRoot))) {
    if (!supportedExtensions.has(extname(path))) continue;

    const source = readFileSync(path, 'utf8');
    const viewportClassPatterns = [
      {
        regex: /(^|[\s"'`])(?:[a-z0-9-]+:)*h-screen(?=$|[\s"'`])/g,
        message: 'Use h-dvh/min-h-dvh so mobile browser chrome does not break the viewport.',
      },
      {
        regex: /(^|[\s"'`])(?:[a-z0-9-]+:)*w-screen(?=$|[\s"'`])/g,
        message: 'Use w-full/max-w-full; w-screen commonly creates horizontal overflow.',
      },
      {
        regex: /\b(?:width\s*:\s*100vw|height\s*:\s*100vh)\b/g,
        message: 'Use percentage width and dynamic viewport units (dvh/dvw).',
      },
    ];

    for (const rule of viewportClassPatterns) {
      for (const match of source.matchAll(rule.regex)) {
        addFinding(path, source, match.index ?? 0, rule.message);
      }
    }

    if (
      extname(path) === '.tsx'
      && source.includes('<table')
      && !/overflow-x-auto|responsive-scroll-region|ResponsiveScrollRegion/.test(source)
    ) {
      addFinding(
        path,
        source,
        source.indexOf('<table'),
        'Wrap tables in a labeled horizontal scroll region or provide a mobile card view.',
      );
    }
  }
}

const layoutSource = readFileSync(join(root, 'app', 'layout.tsx'), 'utf8');
if (!layoutSource.includes('viewportFit') || !layoutSource.includes("width: 'device-width'")) {
  findings.push('app/layout.tsx:1 Export the shared device-width viewport with viewportFit: cover.');
}

const globalCss = readFileSync(join(root, 'app', 'globals.css'), 'utf8');
for (const contractClass of [
  '.responsive-page',
  '.responsive-container',
  '.responsive-grid',
  '.responsive-scroll-region',
  '.responsive-dialog',
]) {
  if (!globalCss.includes(contractClass)) {
    findings.push(`app/globals.css:1 Missing responsive contract primitive ${contractClass}.`);
  }
}

if (findings.length > 0) {
  console.error('Responsive UI contract failed:\n');
  findings.forEach((finding) => console.error(`- ${finding}`));
  console.error('\nSee docs/architecture/responsive-ui-workflow.md for approved patterns.');
  process.exit(1);
}

console.log('Responsive UI contract passed.');
