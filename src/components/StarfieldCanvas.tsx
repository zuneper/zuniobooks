import React, { useEffect, useRef } from 'react';

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Star data structure
    interface Star {
      x: number;
      y: number;
      size: number;
      alpha: number;
      twinkleSpeed: number;
      color: string;
      speedY: number;
      speedX: number;
    }

    const starCount = Math.floor(Math.min(width, 1920) * 0.15);
    const stars: Star[] = [];

    const colors = [
      '#ffffff',
      '#e0e7ff', // subtle indigo
      '#c7d2fe',
      '#bae6fd', // subtle cyan
      '#a5f3fc',
      '#f472b6', // subtle nebula pink accent
      '#c084fc', // purple accent
    ];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.9 ? Math.random() * 1.5 + 0.3 : Math.random() * 2.5 + 1.2,
        alpha: Math.random(),
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: (Math.random() - 0.5) * 0.15,
        speedX: (Math.random() - 0.5) * 0.1,
      });
    }

    // Shooting stars
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      alpha: number;
      active: boolean;
    }

    let shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: 0,
      alpha: 0,
      active: false,
    };

    const spawnShootingStar = () => {
      shootingStar = {
        x: Math.random() * width,
        y: Math.random() * (height * 0.5),
        length: Math.random() * 80 + 60,
        speed: Math.random() * 10 + 12,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        alpha: 1,
        active: true,
      };
    };

    let lastShootingStarTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Twinkle
        star.alpha += star.twinkleSpeed;
        if (star.alpha >= 1) {
          star.alpha = 1;
          star.twinkleSpeed = -star.twinkleSpeed;
        } else if (star.alpha <= 0.1) {
          star.alpha = 0.1;
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Slow movement drift
        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;

        if (star.size > 2) {
          // Add soft glow for larger stars
          ctx.shadowBlur = 8;
          ctx.shadowColor = star.color;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Handle shooting stars
      const now = Date.now();
      if (!shootingStar.active && now - lastShootingStarTime > 4000 + Math.random() * 6000) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      if (shootingStar.active) {
        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.alpha -= 0.015;

        if (
          shootingStar.alpha <= 0 ||
          shootingStar.x > width ||
          shootingStar.y > height
        ) {
          shootingStar.active = false;
        } else {
          ctx.save();
          ctx.globalAlpha = shootingStar.alpha;

          const endX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
          const endY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

          const grad = ctx.createLinearGradient(
            shootingStar.x,
            shootingStar.y,
            endX,
            endY
          );
          grad.addColorStop(0, '#a5f3fc');
          grad.addColorStop(0.5, '#c084fc');
          grad.addColorStop(1, 'transparent');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
        }
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background Deep Space Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#03010b] via-[#08051a] to-[#04020c]" />

      {/* Layered Nebulae Orbs with blend mode */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-900/30 blur-[120px] mix-blend-screen animate-pulse-glow" />
      <div className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full bg-cyan-900/25 blur-[140px] mix-blend-screen animate-pulse-glow" style={{ animationDelay: '3s' }} />
      <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-indigo-900/30 blur-[130px] mix-blend-screen animate-pulse-glow" style={{ animationDelay: '6s' }} />

      {/* Dynamic Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
