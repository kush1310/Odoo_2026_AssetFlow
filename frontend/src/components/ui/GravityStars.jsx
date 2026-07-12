import React, { useEffect, useRef, useCallback } from 'react';

/**
 * GravityStars
 *
 * Canvas-based particle animation where stars drift and are attracted
 * toward the mouse cursor with a gravity-like pull. On mouse-out they
 * slowly drift back to neutral drift.
 *
 * @param  {string} className   - Additional Tailwind classes for the canvas wrapper
 * @param  {number} starCount   - Number of stars to render (default 140)
 * @param  {string} starColor   - CSS color for star fill (default brand teal)
 */
const GravityStars = ({ className = '', starCount = 140, starColor = '#0F6E5F' }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const mouseRef  = useRef({ x: null, y: null });
  const starsRef  = useRef([]);

  const initStars = useCallback((width, height) => {
    starsRef.current = Array.from({ length: starCount }, () => ({
      x:  Math.random() * width,
      y:  Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.6 + 0.2,
    }));
  }, [starCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initStars(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Parse brand color for connection lines
    const hexToRgb = (hex) => {
      const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return res ? `${parseInt(res[1],16)},${parseInt(res[2],16)},${parseInt(res[3],16)}` : '15,110,95';
    };
    const rgb = hexToRgb(starColor);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const stars = starsRef.current;
      const mouse = mouseRef.current;
      const GRAVITY_RADIUS = 120;
      const GRAVITY_STRENGTH = 0.018;
      const CONNECTION_RADIUS = 80;

      stars.forEach(star => {
        // Gravity pull toward mouse
        if (mouse.x !== null) {
          const dx = mouse.x - star.x;
          const dy = mouse.y - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < GRAVITY_RADIUS) {
            const force = (1 - dist / GRAVITY_RADIUS) * GRAVITY_STRENGTH;
            star.vx += dx * force;
            star.vy += dy * force;
          }
        }

        // Dampen velocity
        star.vx *= 0.97;
        star.vy *= 0.97;

        star.x += star.vx;
        star.y += star.vy;

        // Wrap edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${star.alpha})`;
        ctx.fill();
      });

      // Draw connection lines between nearby stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_RADIUS) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(${rgb},${(1 - dist / CONNECTION_RADIUS) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initStars, starColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'auto' }}
    />
  );
};

export default GravityStars;
