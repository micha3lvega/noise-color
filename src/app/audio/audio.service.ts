import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private dataArray!: Uint8Array;
  private source!: MediaStreamAudioSourceNode;
  private stream!: MediaStream;

  constructor() {}

  async getMicrophoneAccess(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Solo crear AudioContext si no existe o está cerrado
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  getDataArray(): Uint8Array {
    return this.dataArray;
  }

  get audioContextState(): string {
    return this.audioContext?.state;
  }

  get audioContextInstance(): AudioContext {
    return this.audioContext;
  }

  stopMicrophone(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
