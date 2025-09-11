/* eslint-disable @typescript-eslint/no-explicit-any, no-var */
// types/global.d.ts

interface SpeechRecognition extends EventTarget {
  start(): void;
  stop(): void;
  abort(): void;
  lang: string;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare var webkitSpeechRecognition: {
  new (): SpeechRecognition;
};

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};
