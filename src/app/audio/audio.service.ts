import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface AudioContextInterface extends AudioContext {
  webkitAudioContext?: AudioContext;
}

@Injectable({
  providedIn: 'root',
})
export class AudioService {

  private audioContext: AudioContextInterface =
    new (window as any).AudioContext() ||
    new (window as any).webkitAudioContext();
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private isListening = new BehaviorSubject(false);

  constructor() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  public async startListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStreamSource =
        this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.analyser);
      this.isListening.next(true);
      setInterval(() => {
        this.analyser.getByteTimeDomainData(this.dataArray);

        const sum = this.dataArray.reduce((total, num) => total + num, 0);
        const average = sum / this.dataArray.length;

        // Umbral del sonido
        const threshold = 50;
        if (average > threshold) {
          console.log('Se detectó un sonido average: ' + average + ', threshold: ' + threshold);
        }
      }, 100);

    } catch (error) {
      console.error('Error al obtener acceso al micrófono:', error);
    }
  }

}
