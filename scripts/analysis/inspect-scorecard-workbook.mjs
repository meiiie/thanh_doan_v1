import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const workbookPath = process.argv[2];
if (!workbookPath) {
  throw new Error('Usage: node inspect-scorecard-workbook.mjs <workbook.xlsx>');
}

const require = createRequire(import.meta.url);
const searchRoot = process.env.CODEX_NODE_MODULES;
const artifactToolPath = require.resolve('@oai/artifact-tool', {
  paths: searchRoot ? [searchRoot] : undefined,
});
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactToolPath).href);

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

const sheetSpecs = [
  { name: 'Đại học, Cao đẳng', range: 'A1:L40', headerRange: 'A2:L2' },
  { name: 'Điểm thưởng', range: 'A1:J30', headerRange: 'A2:J2' },
];

const sheets = sheetSpecs.map((spec) => {
  const sheet = workbook.worksheets.getItem(spec.name);
  const range = sheet.getRange(spec.range);
  const values = range.values;
  const formulas = range.formulas;
  const displayFormulas = range.displayFormulas;

  const formulaCells = [];
  for (let row = 0; row < formulas.length; row += 1) {
    for (let column = 0; column < formulas[row].length; column += 1) {
      const formula = formulas[row][column];
      const displayFormula = displayFormulas[row][column];
      if (!formula && !displayFormula) continue;
      formulaCells.push({
        address: `${columnName(column + 1)}${row + 1}`,
        formula: formula || displayFormula,
        calculatedValue: values[row][column] ?? null,
      });
    }
  }

  return {
    name: spec.name,
    semanticRange: spec.range,
    headers: sheet.getRange(spec.headerRange).values[0],
    formulaCells,
  };
});

console.log(JSON.stringify({ source: workbookPath, sheets }, null, 2));

function columnName(column) {
  let value = column;
  let name = '';
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}
