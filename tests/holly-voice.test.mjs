import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'shift-voice-'));
await build({
  entryPoints: ['src/holly/browserVoiceProvider.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(dir, 'voice.mjs'),
});
const { BrowserVoiceProvider } = await import(
  pathToFileURL(join(dir, 'voice.mjs')).href
);
test('voice is silent until requested; button barge-in cancels speech; stale transcript is discarded', () => {
  const states = [],
    texts = [],
    errors = [];
  let speaks = 0,
    cancels = 0,
    recognition;
  class Recognizer {
    constructor() {
      recognition = this;
    }
    start() {}
    abort() {}
  }
  class Utterance {
    constructor(text) {
      this.text = text;
    }
  }
  globalThis.SpeechSynthesisUtterance = Utterance;
  globalThis.window = {
    SpeechSynthesisUtterance: Utterance,
    SpeechRecognition: Recognizer,
    speechSynthesis: {
      getVoices: () => [{ lang: 'en-US', voiceURI: 'demo', name: 'Demo' }],
      speak: () => speaks++,
      cancel: () => cancels++,
    },
  };
  const voice = new BrowserVoiceProvider({
    onState: (s) => states.push(s),
    onTranscript: (t) => texts.push(t),
    onError: (e) => errors.push(e),
  });
  assert.equal(speaks, 0);
  assert.equal(recognition, undefined);
  voice.speak('Question');
  assert.equal(speaks, 1);
  voice.listen();
  assert.ok(cancels >= 2);
  assert.equal(states.at(-1), 'listening');
  const late = recognition.onresult;
  voice.stop();
  late({
    results: [{ isFinal: true, 0: { transcript: 'stale', confidence: 0.9 } }],
  });
  assert.deepEqual(texts, []);
  voice.listen();
  recognition.onerror({ error: 'not-allowed' });
  assert.match(errors[0], /denied/);
  voice.dispose();
  delete globalThis.window;
  delete globalThis.SpeechSynthesisUtterance;
});
test('unsupported recognition provides typed fallback without requesting audio', () => {
  globalThis.window = { speechSynthesis: { cancel() {} } };
  let error = '';
  const voice = new BrowserVoiceProvider({
    onState() {},
    onTranscript() {},
    onError: (e) => (error = e),
  });
  voice.listen();
  assert.match(error, /Type your answer/);
  delete globalThis.window;
});
test.after(() => rm(dir, { recursive: true, force: true }));
