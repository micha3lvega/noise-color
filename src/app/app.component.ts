import { AudioService } from './audio/audio.service';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'noise-color';
  constructor(private audioService: AudioService) {}
  ngOnInit(): void {
    console.log('Iniciando [AppComponent]');

    this.startMicrophone();
  }

  startMicrophone(): void {
    this.audioService.getMicrophoneAccess().then(() => {
      this.listenToAudio();
    });
  }

  private listenToAudio(): void {
    const analyser = this.audioService.getAnalyser();
    const dataArray = this.audioService.getDataArray();
    console.log('Dibujando...');

    setInterval(() => {
      console.log('dibujando...');

      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += (dataArray[i] - 128) ** 2;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      console.log('Volume: ', volume);
    }, 100);
  }
}
