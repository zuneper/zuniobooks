import React, { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

export const GalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Pull the playback state from our global audio context
  const { isPlaying } = useAudio();
  
  // We use a ref to track the playing state inside the canvas animation loop
  // without triggering a full re-render of the useEffect on every play/pause
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
      baseVx: number;
      baseVy: number;
    }

    const starColors = ['#ffffff', '#e0e7ff', '#c7d2fe', '#bae6fd', '#a5f3fc', '#f472b6', '#c084fc'];
    const numStars = Math.floor((width * height) / 2200);

    const stars: Star[] = Array.from({ length: numStars }, () => {
      const baseVx = (Math.random() - 0.5) * 0.1;
      const baseVy = (Math.random() - 0.5) * 0.1;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.85 ? Math.random() * 1.5 + 0.3 : Math.random() * 2.8 + 1.2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        alpha: Math.random(),
        speed: Math.random() * 0.012 + 0.003,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
      };
    });

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
    let currentWarpSpeed = 1.0;

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

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate warp speed depending on audio playback state
      const targetSpeed = isPlayingRef.current ? 12.0 : 1.0;
      currentWarpSpeed += (targetSpeed - currentWarpSpeed) * 0.02;

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
        // Accelerate twinkling slightly when traveling at warp speed
        star.alpha += star.speed * (currentWarpSpeed * 0.3 + 0.7);
        const currentAlpha = Math.abs(Math.sin(star.alpha));

        // Drift
        star.x += star.baseVx * currentWarpSpeed;
        star.y += star.baseVy * currentWarpSpeed;
        
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.save();
        ctx.beginPath();
        
        // If traveling at warp speed, visually stretch stars into streaks
        if (currentWarpSpeed > 2.0) {
          const stretch = currentWarpSpeed * 1.5;
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x - star.baseVx * stretch, star.y - star.baseVy * stretch);
          ctx.lineWidth = star.size;
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = currentAlpha * 0.7;
          ctx.stroke();
        } else {
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = currentAlpha * 0.9;

          if (star.size > 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = star.color;
          }
          ctx.fill();
        }
        
        ctx.restore();
      });

      // Handle Shooting Stars
      const now = Date.now();
      // Spawn shooting stars significantly faster while playing audio
      const spawnDelay = isPlayingRef.current 
        ? 800 + Math.random() * 1500 
        : 3500 + Math.random() * 5000;

      if (!shootingStar.active && now - lastShootingStar > spawnDelay) {
        spawnShootingStar();
        lastShootingStar = now;
      }

      if (shootingStar.active) {
        // Increase shooting star velocity slightly during playback
        const activeShootingSpeed = shootingStar.speed * (currentWarpSpeed * 0.3 + 0.7);
        shootingStar.x += Math.cos(shootingStar.angle) * activeShootingSpeed;
        shootingStar.y += Math.sin(shootingStar.angle) * activeShootingSpeed;
        shootingStar.alpha -= 0.018 * (currentWarpSpeed > 1 ? 1.5 : 1);

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

      {/* Layered Nebulae Orbs with reactive pulse animations */}
      <div 
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-purple-800/25 via-indigo-900/30 to-cyan-500/10 blur-[120px] mix-blend-screen transition-all duration-1000 ${
          isPlaying ? 'animate-pulse-glow scale-110 opacity-100' : 'animate-float scale-100 opacity-50'
        }`} 
      />
      <div
        className={`absolute top-1/3 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-cyan-900/25 via-purple-900/20 to-indigo-900/15 blur-[140px] mix-blend-screen transition-all duration-1000 ${
          isPlaying ? 'animate-pulse-glow scale-110 opacity-100' : 'animate-float scale-100 opacity-50'
        }`}
        style={{ animationDelay: isPlaying ? '0s' : '3.5s' }}
      />
      <div
        className={`absolute -bottom-32 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-900/30 via-purple-900/25 to-cyan-900/20 blur-[130px] mix-blend-screen transition-all duration-1000 ${
          isPlaying ? 'animate-pulse-glow scale-110 opacity-100' : 'animate-float scale-100 opacity-50'
        }`}
        style={{ animationDelay: isPlaying ? '0s' : '7s' }}
      />
    </div>
  );
};
