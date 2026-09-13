import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'shift-api-'));
await build({entryPoints:['server/previewApi.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'api.mjs')});
const {handlePreviewApi} = await import(pathToFileURL(join(dir,'api.mjs')).href);
process.env.OPENAI_API_KEY = '';
const post = (path, body, headers={}) => handlePreviewApi(new Request('https://shift.example'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}));
test('backend reports its actual storage and research mode',async()=>{
 const r=await handlePreviewApi(new Request('https://shift.example/api/health'));const d=await r.json();
 assert.equal(d.accountMemoryAvailable,false); assert.equal(d.researchSync,'versioned_snapshot');
});
test('reflection response includes server-selected provenance',async()=>{
 const r=await post('/api/shift/breakdown',{situation:'I feel confused about what they said.'}); const d=await r.json();
 assert.equal(r.status,200);assert.ok(d.evidence.cardIds.includes('thought-record'));assert.deepEqual(d.breakdown.confirmed_emotions,[]);
});
test('crisis interrupts before ordinary model guidance',async()=>{
 const d=await (await post('/api/shift/breakdown',{situation:'I want to kill myself'})).json();assert.equal(d.safetyInterruption,true);assert.equal(d.breakdown,undefined);
});
test('practice requires confirmation',async()=>{
 const r=await post('/api/shift/game-content',{gameId:'fact_or_story',observation:'Someone said hello'});assert.equal(r.status,400);
});
test('unsupported storage never reports a successful save',async()=>{
 const r=await post('/api/shift/memory/remember',{});assert.equal(r.status,404);assert.equal((await r.json()).persisted,false);
});
test('bounds and cross-origin protection precede processing',async()=>{
 assert.equal((await post('/api/shift/breakdown',{situation:'x'.repeat(65000)})).status,413);
 assert.equal((await post('/api/shift/breakdown',{situation:'hello'},{Origin:'https://other.example'})).status,403);
});
test.after(async()=>{await rm(dir,{recursive:true,force:true});});
