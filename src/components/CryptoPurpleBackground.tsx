import React, { useEffect, useRef } from 'react';

export const CryptoPurpleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Cryptographic security nodes (subtle constellation/circuit mesh, NO numbers)
    const nodeCount = 38;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18, // Very slow motion
      vy: (Math.random() - 0.5) * 0.18,
      radius: 1.5 + Math.random() * 2,
      baseAlpha: 0.15 + Math.random() * 0.25,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      // Extremely slow and smooth time advance
      time += 0.005;

      // Deep dark violet-slate background with subtle trail
      ctx.fillStyle = 'rgba(6, 4, 14, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Slow breathing ambient central security glow (behind the card)
      const pulse = Math.sin(time * 0.8);
      const centralRadius = Math.min(width, height) * 0.45 + pulse * 25;
      const glow = ctx.createRadialGradient(
        centerX,
        centerY,
        30,
        centerX,
        centerY,
        Math.max(80, centralRadius)
      );
      glow.addColorStop(0, 'rgba(147, 51, 234, 0.14)');
      glow.addColorStop(0.5, 'rgba(126, 34, 206, 0.06)');
      glow.addColorStop(1, 'rgba(6, 4, 14, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // 2. Slow concentric cyber radar rings expanding outward from the center
      const maxRadius = Math.max(width, height) * 0.65;
      const ringCount = 4;
      for (let r = 0; r < ringCount; r++) {
        // Continuous slow expansion
        const currentProgress = (time * 0.08 + r / ringCount) % 1;
        const currentR = currentProgress * maxRadius;
        const alpha = Math.sin(currentProgress * Math.PI) * 0.12;

        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Subtle Hexagonal / Quantum Circuit Grid Lines
      const gridSize = 80;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.035)';
      ctx.lineWidth = 1;
      const startX = (time * 4) % gridSize;
      for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 4. Smooth cryptographic mesh nodes and interconnections (NO numbers/text)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Wrap around smoothly
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        const nodeAlpha = n.baseAlpha + Math.sin(time + n.pulseOffset) * 0.1;

        // Draw connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.hypot(dx, dy);
          const maxDist = 140;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.15;
            ctx.strokeStyle = `rgba(192, 132, 252, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw node point
        ctx.fillStyle = `rgba(216, 180, 254, ${Math.max(0.05, nodeAlpha)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-0"
    />
  );
};