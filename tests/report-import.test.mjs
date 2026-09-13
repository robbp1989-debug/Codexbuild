import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
await mkdir('node_modules/.cache', { recursive: true });
const dir = await mkdtemp(resolve('node_modules/.cache/report-test-'));
await build({
  entryPoints: ['src/personalization/readReport.ts'],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: join(dir, 'report.mjs'),
});
const { readReport } = await import(
  pathToFileURL(join(dir, 'report.mjs')).href
);
test('text and DOCX imports extract plain text without markup execution', async () => {
  assert.equal(
    await readReport(new File(['<script>alert(1)</script>'], 'report.txt')),
    '<script>alert(1)</script>',
  );
  const docx = new File(
    [await readFile('tests/fixtures/fictional-report.docx')],
    'fictional.docx',
  );
  assert.equal(await readReport(docx), 'Fictional report: examples may help.');
});
test('empty, oversized, unsupported, malformed DOCX and overlong text fail clearly', async () => {
  for (const file of [
    new File([], 'empty.txt'),
    new File(['x'.repeat(4 * 1024 * 1024 + 1)], 'large.txt'),
    new File(['x'], 'report.exe'),
    new File(['not a zip'], 'report.docx'),
    new File(['x'.repeat(80001)], 'long.txt'),
  ])
    await assert.rejects(() => readReport(file));
});
test.after(() => rm(dir, { recursive: true, force: true }));
