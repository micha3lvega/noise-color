import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService implements OnDestroy {

  private audioContext!: AudioContext;
  private mediaStream!: MediaStream | null;
  private mediaStreamSource!: MediaStreamAudioSourceNode | null;
  private analyser!: AnalyserNode;
  private dataArray!: Uint8Array;

  constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.mediaStream = null;
    this.mediaStreamSource = null;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  async getMicrophoneAccess(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );
      this.mediaStreamSource.connect(this.analyser);
      console.log('Microphone access granted');
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  getDataArray(): Uint8Array {
    return this.dataArray;
  }

  stopMicrophone(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
  }

  ngOnDestroy(): void {
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.audioContext.close();
    }
    console.log('Close...');

  }
}
