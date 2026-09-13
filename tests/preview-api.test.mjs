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
 assert.equal(d.accountMemoryAvailable,false); assert.equal(d.researchSync,'versioned_snapshot'); assert.equal(d.configuredModel,'gpt-5.6-luna');
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
test('a successful model conversation is labeled and uses the verified model',async()=>{
 const priorFetch=globalThis.fetch; process.env.OPENAI_API_KEY='test-key';
 globalThis.fetch=async(_url,options)=>{
  const request=JSON.parse(options.body);
  assert.equal(request.model,'gpt-5.6-luna');
  return Response.json({choices:[{message:{content:JSON.stringify({reply:'A response tied to this message.',memorySuggestion:null})}}]},{headers:{'x-request-id':'req_test_success'}});
 };
 try {
  const r=await post('/api/shift/conversation',{message:'This is a fictional ordinary message.',currentShift:{observation:'A fictional event.'}});const d=await r.json();
  assert.equal(r.status,200);assert.equal(d.responseMode,'model');assert.equal(d.reply,'A response tied to this message.');
 } finally { globalThis.fetch=priorFetch; process.env.OPENAI_API_KEY=''; }
});
test('provider failure is transparent instead of returning a pretend conversation',async()=>{
 const priorFetch=globalThis.fetch; const priorWarn=console.warn; process.env.OPENAI_API_KEY='test-key';
 globalThis.fetch=async()=>Response.json({error:{type:'invalid_request_error',code:'model_not_found',message:'must not be logged'}},{status:404,headers:{'x-request-id':'req_safe_test'}});
 const warnings=[]; console.warn=(...items)=>warnings.push(items);
 try {
  const r=await post('/api/shift/conversation',{message:'Another fictional ordinary message.',currentShift:{observation:'A fictional event.'}});const d=await r.json();
  assert.equal(r.status,200);assert.equal(d.responseMode,'unavailable');assert.equal(d.unavailableReason,'provider_error');
  assert.match(d.reply,/temporarily unavailable/);assert.doesNotMatch(d.reply,/landing hardest|what part/i);
  assert.equal(warnings[0][1].model,'gpt-5.6-luna');assert.equal(warnings[0][1].status,404);assert.equal(warnings[0][1].code,'model_not_found');
  assert.ok(!JSON.stringify(warnings).includes('must not be logged'));
 } finally { globalThis.fetch=priorFetch; console.warn=priorWarn; process.env.OPENAI_API_KEY=''; }
});
test.after(async()=>{await rm(dir,{recursive:true,force:true});});
