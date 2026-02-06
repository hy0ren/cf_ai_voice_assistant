import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.offsetWidth;
    const displayHeight = canvas.offsetHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 40;
    const gap = 3;

    // Smoothed values for fluid animation
    const smoothed = new Float32Array(barCount);

    function draw() {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const totalGap = (barCount - 1) * gap;
      const barWidth = (displayWidth - totalGap) / barCount;
      const centerY = displayHeight / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i * bufferLength) / barCount);
        const raw = dataArray[dataIndex] / 255;

        // Exponential smoothing for fluid feel
        smoothed[i] = smoothed[i] * 0.7 + raw * 0.3;
        const value = smoothed[i];

        const barHeight = Math.max(1, value * centerY * 0.9);
        const x = i * (barWidth + gap);

        // Amber palette: dim to bright based on amplitude
        const brightness = 40 + value * 60;
        const saturation = 80 + value * 20;
        const alpha = 0.25 + value * 0.75;

        // Base bar
        ctx.fillStyle = `hsla(40, ${saturation}%, ${brightness}%, ${alpha})`;
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);

        // Hot tip glow on loud bars
        if (value > 0.5) {
          const glowAlpha = (value - 0.5) * 1.2;
          ctx.fillStyle = `hsla(45, 100%, 75%, ${glowAlpha * 0.4})`;
          ctx.fillRect(
            x - 1,
            centerY - barHeight - 2,
            barWidth + 2,
            4
          );
          ctx.fillRect(
            x - 1,
            centerY + barHeight - 2,
            barWidth + 2,
            4
          );
        }
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
    <div className="w-full max-w-sm animate-reveal">
      <canvas
        ref={canvasRef}
        className="w-full rounded-sm"
        style={{ height: '44px' }}
      />
    </div>
  );
}
