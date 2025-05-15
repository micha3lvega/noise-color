import { AudioService } from './audio/audio.service';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Circle } from './circle';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [MatIconModule]
})
export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private animationFrameId!: number;

  circles: Circle[] = [];
  totalCirclesCreated: number = 0; // Contador de círculos creados desde el inicio

  MAX_CIRCLES: number = 100;
  MAX_TIME_FADE_OUT_MILIS: number = 3000;
  MIN_TIME_FADE_OUT_MILIS: number = 1500;
  MIN_VOLUME_SOUND: number = 0.05;

  run: boolean = false;
  volumenActual: number = 0;

  constructor(private audioService: AudioService) {}

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    console.log('bounds: ', bounds);

    canvas.width = bounds.width;
    canvas.height = bounds.height;
    this.ctx = canvas.getContext('2d')!;
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
  }

  startMicrophone(): void {
    console.log("...................................");

    this.run = true;
    this.audioService.getMicrophoneAccess().then(() => {
      if (this.audioService.audioContextState === 'suspended') {
        this.audioService.audioContextInstance.resume();
      }
      this.listenToAudio();
    });
  }

  stopMicrophone(): void {
    this.run = false;
    this.audioService.stopMicrophone();
    cancelAnimationFrame(this.animationFrameId);
    this.listenToAudio();
  }

  private listenToAudio(): void {
    const analyser = this.audioService.getAnalyser();
    const dataArray = this.audioService.getDataArray();

    if (this.run) {
      const draw = () => {
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += (dataArray[i] - 128) ** 2;
        }

        const volume = Math.sqrt(sum / dataArray.length);

        this.volumenActual = Math.min(volume / 10, 1);

        if (volume > this.MIN_VOLUME_SOUND) {
          this.createCircle(volume);
        }

        this.updateCircles();
        this.animationFrameId = requestAnimationFrame(draw);
      };

      draw();
    }
  }

  private createCircle(volume: number): void {
    if (this.circles.length >= this.MAX_CIRCLES) {
      this.circles.shift();
    }

    const canvas = this.canvasRef.nativeElement;
    const maxSize = Math.max(canvas.width, canvas.height);

    const escala = Math.min(volume / 5, 1); // Normaliza entre 0 y 1
    const initialRadius = 10 + escala * 50; // Tamaño entre 10 y 60 px aprox

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const color = `hsla(${Math.random() * 360}, 100%, 50%, 0.8)`;
    const startTime = Date.now();
    const fadeOutTime =
      Math.random() *
        (this.MAX_TIME_FADE_OUT_MILIS - this.MIN_TIME_FADE_OUT_MILIS) +
      this.MIN_TIME_FADE_OUT_MILIS;

    const newCircle: Circle = {
      x,
      y,
      radius: initialRadius,
      color,
      startTime,
      fadeOutTime,
    };
    this.circles.push(newCircle);
    this.totalCirclesCreated++; // Incrementar el contador de círculos creados
  }

  private updateCircles(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const currentTime = Date.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.circles.forEach((circle, index) => {
      const timeElapsed = currentTime - circle.startTime;
      const alpha = Math.max(1 - timeElapsed / circle.fadeOutTime, 0);
      const radius = circle.radius * alpha;

      if (alpha <= 0) {
        this.circles.splice(index, 1);
      } else {
        // Dibujar círculo externo
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = circle.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Dibujar círculo interno más pequeño
        const innerRadius = radius * 0.8; // Tamaño del círculo interno (ajustable según preferencias)
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = circle.color;
        ctx.globalAlpha = alpha * 0.5; // Opacidad reducida para el círculo interno
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }
}
