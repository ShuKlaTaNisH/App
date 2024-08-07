declare module 'react-native-background-timer' {
    export default class BackgroundTimer {
      static start(): void;
      static stop(): void;
      static setTimeout(callback: () => void, timeout: number): number;
      static clearTimeout(timeoutId: number): void;
      static setInterval(callback: () => void, timeout: number): number;
      static clearInterval(intervalId: number): void;
    }
  }
  