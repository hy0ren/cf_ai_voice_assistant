import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.offsetWidth;
    const displayHeight = canvas.offsetHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 48;
    const gap = 2;

    function draw() {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const barWidth = (displayWidth - (barCount - 1) * gap) / barCount;
      const centerY = displayHeight / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i * bufferLength) / barCount);
        const value = dataArray[dataIndex] / 255;
        // Add some minimum height and smooth the value
        const barHeight = Math.max(2, value * centerY * 0.85);

        const x = i * (barWidth + gap);

        // Create a blue-to-purple gradient per bar
        const hue = 220 + (i / barCount) * 80;
        const saturation = 70 + value * 30;
        const lightness = 55 + value * 15;
        const alpha = 0.5 + value * 0.5;

        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

        // Draw mirrored bars from center
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
      }
    }

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [stream, isActive]);

  if (!isActive) return null;

  return (
    <div className="w-full max-w-md animate-fade-in">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ height: '48px' }}
      />
    </div>
  );
}
