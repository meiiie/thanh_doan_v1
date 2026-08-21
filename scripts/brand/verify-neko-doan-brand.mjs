import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..', '..');
const brand = path.join(root, 'docs', 'assets', 'brand', 'neko-doan-v1');
const interfaceIcons = path.join(root, 'docs', 'assets', 'icons', 'neko-interface-v1');
const publicRoot = path.join(root, 'app', 'frontend', 'public');
const publicBrand = path.join(publicRoot, 'brand', 'neko-doan-v1');
const publicInterfaceIcons = path.join(publicRoot, 'icons', 'neko-interface-v1');

const publishedFiles = new Map([
  ['logo/neko-doan-mark.svg', 'neko-doan-mark.svg'],
  ['logo/neko-doan-mark-on-dark.svg', 'neko-doan-mark-on-dark.svg'],
  ['logo/neko-doan-mark-mono.svg', 'neko-doan-mark-mono.svg'],
  ['logo/png/neko-doan-icon-16.png', 'neko-doan-icon-16.png'],
  ['logo/png/neko-doan-icon-32.png', 'neko-doan-icon-32.png'],
  ['logo/png/neko-doan-icon-48.png', 'neko-doan-icon-48.png'],
  ['logo/png/neko-doan-icon-180.png', 'neko-doan-icon-180.png'],
  ['logo/png/neko-doan-icon-192.png', 'neko-doan-icon-192.png'],
  ['logo/png/neko-doan-icon-512.png', 'neko-doan-icon-512.png'],
  ['social/neko-doan-social-card.png', 'neko-doan-social-card.png'],
]);

function fail(message) {
  throw new Error(`Brand gate: ${message}`);
}

function digest(data) {
  return createHash('sha256').update(data).digest('hex');
}

function portableTextDigest(data) {
  const normalized = data.toString('utf8').replace(/\r\n?/g, '\n');
  return digest(normalized);
}

function pngSize(data) {
  const signature = '89504e470d0a1a0a';
  if (data.subarray(0, 8).toString('hex') !== signature) fail('invalid PNG signature');
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

async function allFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await allFiles(absolute)));
    if (entry.isFile()) result.push(absolute);
  }
  return result.sort();
}

for (const [sourceName, publicName] of publishedFiles) {
  const source = await readFile(path.join(brand, ...sourceName.split('/')));
  const published = await readFile(path.join(publicBrand, publicName));
  if (digest(source) !== digest(published)) fail(`${publicName} drifted from canonical source`);
}

const favicon = await readFile(path.join(publicRoot, 'favicon.ico'));
const canonicalFavicon = await readFile(path.join(brand, 'logo', 'neko-doan.ico'));
if (digest(favicon) !== digest(canonicalFavicon)) fail('favicon.ico drifted from canonical source');

const dimensions = new Map([
  ['neko-doan-icon-16.png', [16, 16]],
  ['neko-doan-icon-32.png', [32, 32]],
  ['neko-doan-icon-48.png', [48, 48]],
  ['neko-doan-icon-180.png', [180, 180]],
  ['neko-doan-icon-192.png', [192, 192]],
  ['neko-doan-icon-512.png', [512, 512]],
  ['neko-doan-social-card.png', [1200, 630]],
]);
for (const [name, expected] of dimensions) {
  const actual = pngSize(await readFile(path.join(publicBrand, name)));
  if (actual[0] !== expected[0] || actual[1] !== expected[1]) {
    fail(`${name} is ${actual.join('×')}, expected ${expected.join('×')}`);
  }
}

const manifest = JSON.parse(await readFile(path.join(brand, 'manifest.json'), 'utf8'));
const expectedAssets = new Map(manifest.assets.map((asset) => [asset.path, asset]));
for (const absolute of await allFiles(brand)) {
  const relative = path.relative(brand, absolute).replaceAll('\\', '/');
  if (relative === 'manifest.json') continue;
  const data = await readFile(absolute);
  const entry = expectedAssets.get(relative);
  if (!entry || entry.bytes !== data.length || entry.sha256 !== digest(data)) {
    fail(`manifest drift for ${relative}`);
  }
  expectedAssets.delete(relative);
}
if (expectedAssets.size > 0) fail(`manifest contains missing assets: ${[...expectedAssets.keys()]}`);

const iconManifest = JSON.parse(
  await readFile(path.join(interfaceIcons, 'manifest.json'), 'utf8'),
);
if (
  iconManifest.name !== 'Neko Interface Icons' ||
  iconManifest.upstream?.name !== 'Phosphor Icons' ||
  iconManifest.upstream?.version !== '2.1.1' ||
  iconManifest.upstream?.license !== 'MIT'
) {
  fail('interface icon provenance is incomplete');
}
for (const asset of iconManifest.assets) {
  const source = await readFile(path.join(interfaceIcons, ...asset.path.split('/')));
  const published = await readFile(path.join(publicInterfaceIcons, asset.runtime));
  if (source.length !== asset.bytes || digest(source) !== asset.sha256) {
    fail(`interface icon manifest drift for ${asset.path}`);
  }
  if (digest(source) !== digest(published)) {
    fail(`interface icon ${asset.runtime} drifted from canonical source`);
  }
}
const iconLicense = await readFile(path.join(interfaceIcons, 'LICENSE.phosphor.txt'));
const publishedIconLicense = await readFile(
  path.join(publicInterfaceIcons, 'LICENSE.phosphor.txt'),
);
if (
  portableTextDigest(iconLicense) !==
    'b5b1f1da112d18ea2147decfd48ddc1bf2b5aeb6c265381579340e95b15a2bb2' ||
  portableTextDigest(iconLicense) !== portableTextDigest(publishedIconLicense)
) {
  fail('Phosphor license drifted from the imported MIT license');
}

const webManifest = JSON.parse(await readFile(path.join(publicRoot, 'site.webmanifest'), 'utf8'));
if (webManifest.name !== 'Neko Đoàn' || webManifest.lang !== 'vi' || webManifest.start_url !== '/login') {
  fail('site.webmanifest identity or start_url is incorrect');
}
if (webManifest.icons?.length !== 2) fail('site.webmanifest must publish 192px and 512px icons');

const robots = await readFile(path.join(publicRoot, 'robots.txt'), 'utf8');
if (!/User-agent:\s*\*/i.test(robots) || !/Disallow:\s*\//i.test(robots)) {
  fail('robots.txt must block the internal application');
}

const index = await readFile(path.join(root, 'app', 'frontend', 'src', 'index.html'), 'utf8');
for (const marker of [
  'noindex, nofollow, noarchive, nosnippet, noimageindex',
  'site.webmanifest',
  'brand/neko-doan-v1/neko-doan-mark.svg',
  'brand/neko-doan-v1/neko-doan-social-card.png',
  'og:site_name',
  'twitter:card',
]) {
  if (!index.includes(marker)) fail(`index.html is missing ${marker}`);
}
if (index.includes('rel="canonical"') || index.includes('application/ld+json')) {
  fail('internal shell must not publish a fake canonical URL or public schema');
}

const nginx = await readFile(path.join(root, 'app', 'frontend', 'nginx.conf'), 'utf8');
if (!nginx.includes('X-Robots-Tag')) fail('Nginx must enforce X-Robots-Tag');
if (!nginx.includes('default_type application/manifest+json')) {
  fail('Nginx must serve site.webmanifest with the manifest MIME type');
}

console.log(
  `Brand gate passed: ${publishedFiles.size + 1} brand assets, ${iconManifest.assets.length} interface icons and ${manifest.assets.length} canonical brand files.`,
);
