import React, { useEffect, useRef } from 'react';

export const GalaxyBackground: React.FC = () => {
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

    // Dynamic Starfield Particles
    interface Star {
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
      speed: number;
      vx: number;
      vy: number;
    }

    const starColors = ['#ffffff', '#e0e7ff', '#c7d2fe', '#bae6fd', '#a5f3fc', '#f472b6', '#c084fc'];
    const numStars = Math.floor((width * height) / 2200);

    const stars: Star[] = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.85 ? Math.random() * 1.5 + 0.3 : Math.random() * 2.8 + 1.2,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: Math.random(),
      speed: Math.random() * 0.012 + 0.003,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));

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

    let lastShootingStar = Date.now();

    const spawnShootingStar = () => {
      shootingStar = {
        x: Math.random() * width * 0.8,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 90 + 70,
        speed: Math.random() * 8 + 12,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        alpha: 1,
        active: true,
      };
    };

    let tick = 0;

    const render = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      // Radial Cosmic Background Base Gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      bgGrad.addColorStop(0, '#0d0726'); // cosmic deep violet core
      bgGrad.addColorStop(0.4, '#070418'); // midnight indigo
      bgGrad.addColorStop(1, '#020108'); // cosmic black void

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Dynamic Twinkling Stars
      stars.forEach((star) => {
        star.alpha += star.speed;
        const currentAlpha = Math.abs(Math.sin(star.alpha));

        // Drift
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha * 0.9;

        if (star.size > 2) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = star.color;
        }

        ctx.fill();
        ctx.restore();
      });

      // Handle Shooting Stars
      const now = Date.now();
      if (!shootingStar.active && now - lastShootingStar > 3500 + Math.random() * 5000) {
        spawnShootingStar();
        lastShootingStar = now;
      }

      if (shootingStar.active) {
        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.alpha -= 0.018;

        if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
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
          grad.addColorStop(0.4, '#c084fc');
          grad.addColorStop(1, 'transparent');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.5;
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
      {/* Canvas for dynamic stars and shooting stars */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Layered Nebulae Orbs with screen mix-blend-mode */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-purple-800/25 via-indigo-900/30 to-cyan-500/10 blur-[120px] mix-blend-screen animate-pulse-glow" />
      <div
        className="absolute top-1/3 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-cyan-900/25 via-purple-900/20 to-indigo-900/15 blur-[140px] mix-blend-screen animate-pulse-glow"
        style={{ animationDelay: '3.5s' }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-900/30 via-purple-900/25 to-cyan-900/20 blur-[130px] mix-blend-screen animate-pulse-glow"
        style={{ animationDelay: '7s' }}
      />
    </div>
  );
};

