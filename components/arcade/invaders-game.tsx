'use client';
import { useEffect, useRef } from "react";

export function InvadersGame({ bro }: { bro: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Simple placeholder rendering
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={400}
      className="mx-auto block bg-black"
    />
  );
}
