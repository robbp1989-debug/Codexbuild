export type VoiceState = 'idle' | 'speaking' | 'listening' | 'paused';
export interface VoiceOption {
  id: string;
  name: string;
}
export interface VoiceCallbacks {
  onState: (state: VoiceState) => void;
  onTranscript: (
    text: string,
    final: boolean,
    confidence: number | null,
  ) => void;
  onError: (message: string) => void;
}
export interface VoiceProvider {
  voices(): VoiceOption[];
  speak(text: string, voiceId?: string, listenAfter?: boolean): void;
  listen(): void;
  stop(): void;
  dispose(): void;
}
