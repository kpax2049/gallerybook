import { readFile } from 'node:fs/promises';

const distUrl = new URL('../dist/', import.meta.url);
const indexHtml = await readFile(new URL('index.html', distUrl), 'utf8');
const deferredAssetPattern =
  /\/assets\/(?:Gallery(?:Editor)?|editor|mdx-editor)-[^"']+\.(?:js|css)/g;
const eagerEditorAssets = [
  ...new Set(indexHtml.match(deferredAssetPattern) ?? []),
];
const moduleScriptTag = indexHtml.match(
  /<script\b[^>]*\btype=["']module["'][^>]*>/
)?.[0];
const entryPath = moduleScriptTag?.match(/\bsrc=["']([^"']+)["']/)?.[1];
const maxEntryBytes = 1_000_000;

if (eagerEditorAssets.length) {
  console.error(
    `Editor assets must remain deferred, but dist/index.html eagerly loads: ${eagerEditorAssets.join(', ')}`
  );
  process.exitCode = 1;
} else if (!entryPath) {
  console.error('Initial bundle check could not find the module entry script.');
  process.exitCode = 1;
} else {
  const entry = await readFile(new URL(entryPath.replace(/^\//, ''), distUrl));
  if (entry.byteLength > maxEntryBytes) {
    console.error(
      `Initial entry is ${entry.byteLength} bytes; expected no more than ${maxEntryBytes} bytes.`
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Initial bundle check passed: editor assets are deferred and the entry is ${entry.byteLength} bytes.`
    );
  }
}
