import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

test('unbundled emitted Vercel entry loads and serves health in Node ESM', async () => {
 const dir = await mkdtemp(join(tmpdir(), 'shift-runtime-'));
 try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc','api/shift.ts','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','--skipLibCheck','--outDir',dir,'--rootDir','.'], {stdio:'pipe'});
  await writeFile(join(dir,'package.json'), JSON.stringify({type:'module'}));
  const {default: handler} = await import(pathToFileURL(join(dir,'api/shift.js')).href);
  const response = await handler.fetch(new Request('https://shift.example/api/health'));
  assert.equal(response.status,200);
  assert.equal((await response.json()).sourceCheckedCards,4);
 } finally { await rm(dir,{recursive:true,force:true}); }
});
