import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const workbookPath = process.argv[2];
const outputPath = process.argv[3];
if (!workbookPath || !outputPath) {
  throw new Error('Usage: node generate-scorecard-seed.mjs <workbook.xlsx> <migration.sql>');
}

const require = createRequire(import.meta.url);
const searchRoot = process.env.CODEX_NODE_MODULES;
const artifactToolPath = require.resolve('@oai/artifact-tool', {
  paths: searchRoot ? [searchRoot] : undefined,
});
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactToolPath).href);
const bytes = await fs.readFile(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const coreRows = workbook.worksheets.getItem('Đại học, Cao đẳng').getRange('A1:L40').values;
const bonusRows = workbook.worksheets.getItem('Điểm thưởng').getRange('A1:J30').values;

const groups = [...readCoreGroups(coreRows), ...readBonusGroups(bonusRows)];
const coreMaximum = sum(groups.filter((group) => group.section === 'CORE'));
const bonusRawMaximum = sum(groups.filter((group) => group.section === 'BONUS'));
const bonusCap = number(coreRows[34]?.[5]) ?? 25;
const sourceHash = createHash('sha256').update(bytes).digest('hex').toUpperCase();

const statements = [
  '-- Generated from the customer workbook. Do not hand-edit scoring rows.',
  `-- Source SHA-256: ${sourceHash}`,
  '',
  `insert into source_document (id, file_name, sha256, received_scope, imported_at) values (`,
  `  'source-scorecard-dhcd-2026', ${sql('2. (ĐHCĐ) Bảng điểm Chiến dịch TNTN Hè 2026.xlsx')},`,
  `  '${sourceHash}', 'Đại học, Cao đẳng!A1:L40; Điểm thưởng!A1:J30', current_timestamp`,
  ');',
  '',
  `insert into campaign (id, name, phase, scorecard_version_id, version) values (`,
  `  'campaign-summer-2026', ${sql('Chiến dịch Thanh niên tình nguyện Hè 2026')},`,
  `  'PREPARATION', 'scorecard-dhcd-v1', 0`,
  ');',
  '',
  `insert into scorecard_version (id, campaign_id, title, audience, status, source_document_id, core_maximum, bonus_raw_maximum, bonus_cap, version) values (`,
  `  'scorecard-dhcd-v1', 'campaign-summer-2026', ${sql('Bảng điểm khối Đại học, Cao đẳng')},`,
  `  ${sql('Đoàn các trường Đại học, Cao đẳng trực thuộc Thành đoàn Hải Phòng')}, 'DRAFT',`,
  `  'source-scorecard-dhcd-2026', ${decimal(coreMaximum)}, ${decimal(bonusRawMaximum)}, ${decimal(bonusCap)}, 0`,
  ');',
  '',
  ...[
    ['COMMUNE', 'Xã, phường, đặc khu', 114, 'duananhCuong.pdf'],
    ['UNIVERSITY', 'Đại học, cao đẳng', 16, 'duananhCuong.pdf; workbook ĐHCĐ 2026'],
    ['CIVIL_SERVICE', 'Khối công chức', 2, 'duananhCuong.pdf'],
    ['ARMED_FORCES', 'Khối lực lượng vũ trang', 2, 'duananhCuong.pdf'],
  ].map(([code, name, count, source]) =>
    `insert into unit_group (code, name, documented_unit_count, source_reference) values (${sql(code)}, ${sql(name)}, ${count}, ${sql(source)});`,
  ),
  '',
];

for (const group of groups) {
  statements.push(
    `insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values (` +
      `${sql(group.id)}, 'scorecard-dhcd-v1', ${sql(group.code)}, ${sql(group.title)}, ${sql(group.section)}, ${group.order});`,
  );
  for (const line of group.lines) {
    statements.push(
      `insert into scorecard_line (` +
        `id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order` +
        `) values (` +
        [
          sql(line.id),
          `'scorecard-dhcd-v1'`,
          sql(group.id),
          sql(line.code),
          sql(line.title),
          sql(line.requirement),
          sql(line.evidenceHint),
          sql(line.reportTemplate),
          sql(line.evidencePolicy),
          decimal(line.maximum),
          sql(line.sourceSheet),
          line.sourceRow,
          line.order,
        ].join(', ') +
        `);`,
    );
  }
  statements.push('');
}

await fs.writeFile(outputPath, `${statements.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, groups: groups.length, lines: groups.flatMap((g) => g.lines).length, coreMaximum, bonusRawMaximum, bonusCap, sourceHash }));

function readCoreGroups(rows) {
  const groups = [];
  let active = null;
  let activeRequirement = '';
  for (let index = 4; index < 34; index += 1) {
    const row = rows[index];
    const sequence = integer(row[0]);
    const maximum = number(row[5]);
    if (sequence !== null) {
      activeRequirement = text(row[2]);
      active = {
        id: `group-i-${String(sequence).padStart(2, '0')}`,
        code: `I.${String(sequence).padStart(2, '0')}`,
        order: groups.length + 1,
        section: 'CORE',
        title: text(row[1]),
        lines: [],
      };
      groups.push(active);
    }
    if (!active || maximum === null) continue;
    active.lines.push(buildLine({
      group: active,
      row,
      sourceRow: index + 1,
      lineIndex: active.lines.length + 1,
      maximum,
      requirement: text(row[2]) || activeRequirement,
      title: text(row[1]) || text(row[2]) || (text(row[3]) ? `Phần việc do ${text(row[3])} theo dõi` : active.title),
      sourceSheet: 'Đại học, Cao đẳng',
    }));
  }
  normalizeCodes(groups);
  return groups;
}

function readBonusGroups(rows) {
  const starts = rows.flatMap((row, index) => (/^II\.\d+$/.test(text(row[0])) ? [index] : []));
  const groups = starts.map((start, groupIndex) => {
    const row = rows[start];
    const code = text(row[0]);
    const group = {
      id: `group-${code.toLowerCase().replaceAll('.', '-')}`,
      code,
      order: 22 + groupIndex + 1,
      section: 'BONUS',
      title: text(row[1]),
      lines: [],
    };
    const end = starts[groupIndex + 1] ?? rows.length;
    const children = rows.slice(start + 1, end).flatMap((child, offset) => {
      const sequence = integer(child[0]);
      const maximum = number(child[5]);
      return sequence !== null && maximum !== null ? [{ row: child, sourceRow: start + offset + 2, maximum }] : [];
    });
    if (children.length === 0) {
      group.lines.push(buildLine({ group, row, sourceRow: start + 1, lineIndex: 1, maximum: number(row[5]) ?? 0, requirement: text(row[2]), title: group.title, sourceSheet: 'Điểm thưởng' }));
    } else {
      for (const child of children) {
        const lineIndex = group.lines.length + 1;
        group.lines.push(buildLine({
          group,
          row: child.row,
          sourceRow: child.sourceRow,
          lineIndex,
          maximum: child.maximum,
          requirement: text(child.row[2]) || text(row[2]),
          title: text(child.row[1]) || (code === 'II.1' ? `Hoạt động đăng cai ${lineIndex}` : code === 'II.5' ? `Mô hình sáng tạo ${lineIndex}` : `Thành phần ${lineIndex}`),
          sourceSheet: 'Điểm thưởng',
          inheritedRow: row,
        }));
      }
    }
    return group;
  });
  normalizeCodes(groups);
  return groups;
}

function buildLine({ group, row, inheritedRow = [], sourceRow, lineIndex, maximum, requirement, title, sourceSheet }) {
  const evidenceHint = text(row[8]) || text(inheritedRow[8]);
  return {
    id: `${group.code}-${lineIndex}`,
    code: `${group.code}.${lineIndex}`,
    title,
    requirement,
    evidenceHint,
    reportTemplate: text(row[9]) || text(inheritedRow[9]),
    evidencePolicy: detectEvidencePolicy(requirement, evidenceHint),
    maximum,
    sourceSheet,
    sourceRow,
    order: lineIndex,
  };
}

function normalizeCodes(groups) {
  for (const group of groups) if (group.lines.length === 1) group.lines[0].code = group.code;
}

function detectEvidencePolicy(requirement, evidenceHint) {
  const content = `${requirement} ${evidenceHint}`.toLocaleLowerCase('vi');
  if (content.includes('không yêu cầu') || content.includes('chủ động theo dõi')) return 'INTERNAL';
  if (content.includes('văn bản xác nhận') || content.includes('danh sách')) return 'DOCUMENT';
  if (content.includes('link minh chứng') || content.includes('điền minh chứng')) return 'LINK';
  return 'GUIDED';
}

function sum(groups) {
  return groups.flatMap((group) => group.lines).reduce((total, line) => total + line.maximum, 0);
}
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function integer(value) { const parsed = number(value); return parsed !== null && Number.isInteger(parsed) ? parsed : null; }
function decimal(value) { return Number(value).toFixed(2); }
function sql(value) { return `'${String(value ?? '').replaceAll("'", "''")}'`; }
