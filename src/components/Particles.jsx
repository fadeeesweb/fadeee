import { useEffect, useRef } from 'react';

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = true;
    const reduced = prefersReducedMotion();
    const particles = [];

    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const spriteContext = sprite.getContext('2d');
    if (spriteContext) {
      const gradient = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 70, 100, 0.95)');
      gradient.addColorStop(0.35, 'rgba(226, 29, 72, 0.45)');
      gradient.addColorStop(1, 'rgba(226, 29, 72, 0)');
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, 64, 64);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(24, Math.min(64, Math.round((width * height) / 26000)));
      while (particles.length < target) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -0.08 - Math.random() * 0.22,
          size: 26 + Math.random() * 68,
          alpha: 0.12 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
        });
      }
      while (particles.length > target) particles.pop();
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        const pulse = reduced ? 1 : 0.75 + Math.sin(time / 1600 + particle.phase) * 0.25;
        const size = particle.size * pulse;
        context.globalAlpha = particle.alpha * pulse;
        context.drawImage(sprite, particle.x - size / 2, particle.y - size / 2, size, size);
      }
      context.globalAlpha = 1;
    }

    function step(time) {
      if (!running) return;
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.y < -particle.size) {
          particle.y = height + particle.size;
          particle.x = Math.random() * width;
        }
        if (particle.x < -particle.size) particle.x = width + particle.size;
        if (particle.x > width + particle.size) particle.x = -particle.size;
      }
      draw(time);
      frame = window.requestAnimationFrame(step);
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(frame);
      } else if (!running && !reduced) {
        running = true;
        frame = window.requestAnimationFrame(step);
      }
    }

    resize();
    if (reduced) {
      draw(0);
    } else {
      frame = window.requestAnimationFrame(step);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <canvas className="particles" ref={canvasRef} aria-hidden="true" />;
}
