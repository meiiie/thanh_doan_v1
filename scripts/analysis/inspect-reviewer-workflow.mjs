import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const sourcePath = new URL('../../2. (ĐHCĐ) Bảng điểm Chiến dịch TNTN Hè 2026.xlsx', import.meta.url);
const outputDirectory = new URL('../../lab/audits/reviewer-source-analysis/', import.meta.url);

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(fileURLToPath(sourcePath)));
const sheetSummary = await workbook.inspect({
  kind: 'sheet',
  include: 'id,name',
  maxChars: 4000,
});
const core = await workbook.inspect({
  kind: 'region,formula',
  sheetId: 'Đại học, Cao đẳng',
  range: 'A1:L40',
  maxChars: 18000,
  tableMaxRows: 40,
  tableMaxCols: 12,
  tableMaxCellChars: 180,
});
const bonus = await workbook.inspect({
  kind: 'region,formula',
  sheetId: 'Điểm thưởng',
  range: 'A1:J40',
  maxChars: 18000,
  tableMaxRows: 40,
  tableMaxCols: 10,
  tableMaxCellChars: 180,
});

const corePreview = await workbook.render({
  sheetName: 'Đại học, Cao đẳng',
  range: 'A1:L12',
  scale: 1.5,
  format: 'png',
});
const bonusPreview = await workbook.render({
  sheetName: 'Điểm thưởng',
  range: 'A1:J12',
  scale: 1.5,
  format: 'png',
});

await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(
  new URL('core-reviewer-fields.png', outputDirectory),
  new Uint8Array(await corePreview.arrayBuffer()),
);
await fs.writeFile(
  new URL('bonus-reviewer-fields.png', outputDirectory),
  new Uint8Array(await bonusPreview.arrayBuffer()),
);

console.log('SHEETS');
console.log(sheetSummary.ndjson);
console.log('CORE');
console.log(core.ndjson);
console.log('BONUS');
console.log(bonus.ndjson);
