'use client';

import { useEffect, useRef } from 'react';

export default function Waveform({ data, color, label }: { data: Float32Array; color: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = 'rgba(137,255,244,.16)';
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();
    if (!data.length) return;
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    const step = Math.max(1, Math.floor(data.length / width));
    for (let x = 0; x < width; x += 1) {
      let min = 1;
      let max = -1;
      for (let index = x * step; index < Math.min(data.length, (x + 1) * step); index += 1) {
        min = Math.min(min, data[index]);
        max = Math.max(max, data[index]);
      }
      const y1 = (1 - max) * height / 2;
      const y2 = (1 - min) * height / 2;
      context.moveTo(x, y1);
      context.lineTo(x, y2);
    }
    context.stroke();
  }, [color, data]);

  return <div className="waveform-box"><span>{label}</span><canvas ref={canvasRef} aria-label={label} /></div>;
}
