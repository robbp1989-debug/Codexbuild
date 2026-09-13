import type { VoiceCallbacks, VoiceProvider } from './voiceProvider';
interface RecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string; confidence: number };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: { length: number; [index: number]: RecognitionResult };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export class BrowserVoiceProvider implements VoiceProvider {
  private recognition: Recognition | null = null;
  private generation = 0;
  constructor(private callbacks: VoiceCallbacks) {}
  voices() {
    return (window.speechSynthesis?.getVoices() || [])
      .filter((v) => v.lang.startsWith('en'))
      .map((v) => ({ id: v.voiceURI, name: v.name }));
  }
  stop() {
    this.generation++;
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.abort();
      this.recognition = null;
    }
    window.speechSynthesis?.cancel();
    this.callbacks.onState('paused');
  }
  speak(text: string, voiceId?: string) {
    this.stop();
    const generation = this.generation;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      this.callbacks.onError(
        'Voice playback is unavailable. You can read and type each answer.',
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const english = window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.startsWith('en'));
    utterance.voice =
      english.find((v) => v.voiceURI === voiceId) ||
      english.find((v) =>
        /samantha|zira|jenny|aria|susan|female|hazel|sonia/i.test(v.name),
      ) ||
      english[0] ||
      null;
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => {
      if (generation === this.generation) this.callbacks.onState('idle');
    };
    utterance.onerror = () => {
      if (generation === this.generation)
        this.callbacks.onError(
          'Voice playback failed. Read the question or try another voice.',
        );
    };
    this.callbacks.onState('speaking');
    window.speechSynthesis.speak(utterance);
  }
  listen() {
    this.stop();
    const generation = this.generation;
    const Constructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!Constructor) {
      this.callbacks.onError(
        'Speech recognition is unavailable in this browser. Type your answer; playback remains available.',
      );
      return;
    }
    const recognition = new Constructor();
    this.recognition = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      if (generation !== this.generation) return;
      let transcript = '';
      let final = false;
      let confidence: number | null = null;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        final ||= result.isFinal;
        if (result.isFinal) confidence = result[0].confidence || null;
      }
      this.callbacks.onTranscript(transcript, final, confidence);
    };
    recognition.onerror = (event) => {
      if (generation !== this.generation) return;
      this.stop();
      this.callbacks.onError(
        event.error === 'not-allowed'
          ? 'Microphone permission was denied. You can type instead.'
          : 'Speech recognition stopped. Please type or try the microphone again.',
      );
    };
    recognition.onend = () => {
      if (generation === this.generation) {
        this.recognition = null;
        this.callbacks.onState('idle');
      }
    };
    try {
      recognition.start();
      this.callbacks.onState('listening');
    } catch {
      this.stop();
      this.callbacks.onError(
        'Microphone could not start. You can type instead.',
      );
    }
  }
  dispose() {
    this.stop();
  }
}
