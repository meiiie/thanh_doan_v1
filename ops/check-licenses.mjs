import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const approved = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'EPL-1.0',
  'EPL-2.0',
  'ISC',
  'MIT',
  'MIT-0',
  'MPL-2.0',
  'Python-2.0',
  'Unlicense',
  'X11',
  'GPL-2.0-with-classpath-exception',
]);

function normalize(license) {
  return license
    .trim()
    .replace(/^\((.*)\)$/u, '$1')
    .replace(/^EPL 1\.0$/u, 'EPL-1.0');
}

function isApproved(expression) {
  const normalized = normalize(expression);
  const orBranches = normalized.split(/\s+OR\s+/u);
  if (orBranches.length > 1) return orBranches.some(isApproved);
  const andBranches = normalized.split(/\s+AND\s+/u);
  if (andBranches.length > 1) return andBranches.every(isApproved);
  return approved.has(normalize(normalized));
}

function auditEntries(source, entries) {
  const failures = entries.filter(({ license }) => !license || !isApproved(license));
  if (failures.length) {
    const details = failures.map(({ name, license }) => `  - ${name}: ${license || 'MISSING'}`).join('\n');
    throw new Error(`${source} contains unapproved or missing licenses:\n${details}`);
  }
  console.log(`${source}: ${entries.length} components passed the license policy.`);
}

async function npmEntries(lockPath) {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  return Object.entries(lock.packages)
    .filter(([packagePath]) => packagePath !== '')
    .map(([packagePath, metadata]) => ({
      name: metadata.name ?? packagePath.replace(/^node_modules\//u, ''),
      license: metadata.license,
    }));
}

async function javaEntries(sbomPath) {
  const sbom = JSON.parse(await readFile(sbomPath, 'utf8'));
  return (sbom.components ?? []).map((component) => ({
    name: `${component.group ? `${component.group}:` : ''}${component.name}@${component.version}`,
    license: (component.licenses ?? [])
      .map((entry) => entry.expression ?? entry.license?.id ?? entry.license?.name)
      .filter(Boolean)
      .join(' OR '),
  }));
}

const frontendLock = path.join(projectRoot, 'app', 'frontend', 'package-lock.json');
const contractsLock = path.join(projectRoot, 'app', 'contracts', 'package-lock.json');
const javaSbom = path.join(
  projectRoot,
  'app',
  'backend',
  'target',
  'classes',
  'META-INF',
  'sbom',
  'application.cdx.json',
);

auditEntries('Frontend package-lock', await npmEntries(frontendLock));
auditEntries('Contract tool package-lock', await npmEntries(contractsLock));
auditEntries('Backend CycloneDX SBOM', await javaEntries(javaSbom));
