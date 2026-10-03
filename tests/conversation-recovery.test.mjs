import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import ts from 'typescript';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

await mkdir('node_modules/.cache', { recursive: true });
const dir = await mkdtemp(resolve('node_modules/.cache/conversation-recovery-'));
await build({ entryPoints: ['src/components/reflect/conversationRequest.ts'], bundle: true,
  platform: 'node', format: 'esm', outfile: join(dir, 'request.mjs') });
const { requestConversation, conversationRequestBody, ConversationRequestError,
  conversationFailureNotice, replaceFailedConversationReply } = await import(pathToFileURL(join(dir, 'request.mjs')));
const noWait = async () => {};
const answer = () => Response.json({ reply: 'A fictional response to the actual message.', responseMode: 'model' });

test('a third chat request recovers from a transient failure after two successful turns', async () => {
  let calls = 0;
  const bodies = [];
  const fetcher = async (url, init) => {
    assert.equal(url, '/api/shift/conversation');
    bodies.push(init.body);
    if (++calls === 3) return new Response('Temporary upstream failure', { status: 502 });
    return answer();
  };
  const history = [];
  for (let turn = 1; turn <= 3; turn++) {
    const payload = conversationRequestBody({ message: `Fictional turn ${turn}`, currentShift: { observation: 'Fictional event.' },
      history, personalContext: [], approvedSummary: '', memoryItems: [] });
    const reply = await requestConversation(payload, { fetcher, wait: noWait });
    history.push({ role: 'user', content: payload.message }, { role: 'assistant', content: reply.reply });
  }
  assert.equal(calls, 4);
  assert.equal(bodies[2], bodies[3]);
  assert.equal(history.filter(t => t.role === 'user').length, 3);
  assert.equal(history.filter(t => t.role === 'assistant').length, 3);
  assert.match(JSON.parse(bodies[3]).history[0].content, /turn 1/);
});

test('network interruption and invalid JSON each get one bounded retry without an invented answer', async () => {
  for (const first of [() => { throw new TypeError('Private transport diagnostic'); }, () => new Response('<html>Gateway error</html>')]) {
    let calls = 0;
    const result = await requestConversation({}, { wait: noWait, fetcher: async () => ++calls === 1 ? first() : answer() });
    assert.equal(calls, 2);
    assert.equal(result.responseMode, 'model');
    assert.equal(result.reply, 'A fictional response to the actual message.');
  }
  await assert.rejects(() => requestConversation({}, { wait: noWait, fetcher: async () => new Response('<html>Not a reply</html>') }),
    error => error.kind === 'invalid_response' && error.status === 200);
});

test('sign-in, rate limits and rejected requests are reported distinctly without automatic resubmission', async () => {
  for (const [status, kind] of [[401, 'sign_in'], [403, 'sign_in'], [413, 'request'], [429, 'rate_limit']]) {
    let calls = 0;
    await assert.rejects(() => requestConversation({}, { wait: noWait, fetcher: async () => {
      calls++; return new Response('Private error body must not be shown', { status, headers: { 'cf-ray': 'safe-ref<script>' } });
    } }), error => {
      assert.ok(error instanceof ConversationRequestError);
      assert.equal(error.kind, kind); assert.equal(error.status, status);
      assert.equal(error.reference, 'safe-refscript');
      assert.ok(!error.message.includes('Private'));
      return true;
    });
    assert.equal(calls, 1);
  }
  assert.match(conversationFailureNotice(new ConversationRequestError('sign_in')), /sign-in/);
});

test('persistent transient failure ends after two attempts and manual retry replaces only its status turn', async () => {
  let calls = 0;
  await assert.rejects(() => requestConversation({}, { wait: noWait, fetcher: async () => {
    calls++; return new Response('Temporary failure', { status: 503, headers: { 'x-shift-request-id': 'req-safe' } });
  } }), error => error.kind === 'server' && error.reference === 'req-safe');
  assert.equal(calls, 2);
  const original = [{ role: 'assistant', content: 'Prior valid answer.' }, { role: 'user', content: 'Fictional failed message.' }];
  const failed = { role: 'assistant', content: 'Connection status only.', responseMode: 'unavailable', retryId: 'failed-1' };
  const once = replaceFailedConversationReply(original, 'failed-1', failed);
  const twice = replaceFailedConversationReply(once, 'failed-1', failed);
  assert.equal(twice.length, 3);
  const recovered = replaceFailedConversationReply(twice, 'failed-1', { role: 'assistant', content: 'Actual recovered answer.', responseMode: 'model' });
  assert.equal(recovered.length, 3);
  assert.deepEqual(recovered.slice(0, 2), original);
  assert.equal(recovered.filter(t => t.role === 'user').length, 1);
  assert.equal(recovered.some(t => t.responseMode === 'unavailable'), false);
});

test('requests omit raw source/provenance metadata and failed assistant status from future context', () => {
  const payload = conversationRequestBody({ message: 'Fictional follow-up',
    currentShift: { observation: 'A fictional situation', personalHistoryUsed: ['RAW_SOURCE_MUST_STAY_OUT'], rawInput: 'FULL_INPUT_MUST_STAY_OUT' },
    history: [{ role: 'user', content: 'A prior message.' }, { role: 'assistant', content: 'PRIVATE_STATUS_ONLY', responseMode: 'unavailable' },
      { role: 'assistant', content: 'A valid reply.', responseMode: 'model', influence: { personalHistory: 'EXTRA_METADATA_MUST_STAY_OUT' } }],
    personalContext: [], approvedSummary: '', memoryItems: [] });
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /MUST_STAY_OUT|PRIVATE_STATUS_ONLY/);
  assert.equal(payload.history.length, 2);
  assert.equal(payload.currentShift.observation, 'A fictional situation');
});

test('a provider unavailable reply remains transparent and a safety interruption is never auto-retried', async () => {
  for (const data of [{ reply: 'Live AI unavailable.', responseMode: 'unavailable' }, { safetyInterruption: true, crisisMessage: 'Pause' }]) {
    let calls = 0;
    const result = await requestConversation({}, { wait: noWait, fetcher: async () => { calls++; return Response.json(data); } });
    assert.deepEqual(result, data); assert.equal(calls, 1);
  }
});

async function loadRoute(orchestrateShiftConversation) {
  const key = `route_${crypto.randomUUID().replaceAll('-', '')}`;
  globalThis[key] = {
    personalContextPrompt: () => '', getChatGPTUser: async () => null,
    mergeAccountAndDeviceMemory: () => [], publicMemorySource: () => 'none',
    selectRelevantMemoryContextWithProvenance: () => ({ context: [], origins: [] }),
    hasDurableStorage: () => false, loadLearningMemories: async () => [],
    evaluateSafety: () => ({ isCrisis: false }), embedMemoryQuery: async () => null,
    orchestrateShiftConversation, selectRelevantTherapyLessons: () => [], loadTherapyLessons: async () => [],
    retrieveDetailedHistory: async () => ({ passages: [], available: false, retrieval: 'none' }),
    detailedHistoryPrompt: () => '',
  };
  const source = `const { ${Object.keys(globalThis[key]).join(', ')} } = globalThis['${key}'];\n` +
    (await readFile('app/api/shift/conversation/route.ts', 'utf8')).replace(/^import[\s\S]*?;\n/gm, '');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const module = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}#${key}`);
  delete globalThis[key]; return module.POST;
}

test('production route removes legacy client failure banners and returns a private request reference', async () => {
  const POST = await loadRoute(async args => {
    assert.deepEqual(args.history, [{ role: 'user', content: 'Fictional prior message' }]);
    return { reply: 'Fictional valid reply', responseMode: 'model', research: { status: 'not_needed', sources: [] } };
  });
  const response = await POST(new Request('https://fictional.test/conversation', { method: 'POST', body: JSON.stringify({
    currentShift: { observation: 'Fictional event' }, message: 'Fictional question', history: [
      { role: 'user', content: 'Fictional prior message' }, { role: 'assistant', content: 'Failed status only', responseMode: 'unavailable' },
    ],
  }) }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.ok(response.headers.get('x-shift-request-id'));
  assert.equal((await response.json()).responseMode, 'model');
});

test('production failure logs correlate route/stage without sensitive error text or account content', async () => {
  const POST = await loadRoute(async () => { throw new Error('PRIVATE_USER_TEXT_OR_KEY'); });
  const logs = [];
  const original = console.error; console.error = (...items) => logs.push(items);
  try {
    const response = await POST(new Request('https://fictional.test/conversation', { method: 'POST', body: JSON.stringify({
      currentShift: {}, message: 'PRIVATE_USER_MESSAGE',
    }) }));
    assert.equal(response.status, 500);
    assert.equal(logs[0][1].requestId, response.headers.get('x-shift-request-id'));
    assert.equal(logs[0][1].stage, 'response_generation');
    assert.doesNotMatch(JSON.stringify(logs), /PRIVATE_USER/);
  } finally { console.error = original; }
});

test.after(() => rm(dir, { recursive: true, force: true }));
