'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRiskTint } from '@/lib/RiskTintContext';

export function SiteBackground() {
  const pathname = usePathname();
  const { riskTint } = useRiskTint();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const mousePosRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });
  const scrollYRef = useRef(0);
  const isReducedMotionRef = useRef(false);
  const isVisibleRef = useRef(true);
  const fpsRef = useRef({ lastTime: performance.now(), frames: 0, fps: 60, lowFpsCount: 0 });
  const [reducedMode, setReducedMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Determine route mode
  const isLanding = pathname === '/';
  const isAuth =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-otp') ||
    pathname.startsWith('/set-pin');
  const isAdmin = pathname.startsWith('/admin');

  // Cube data for Layer D (Landing desktop only)
  const cubesRef = useRef<
    Array<{
      x: number;
      y: number;
      size: number;
      rotX: number;
      rotY: number;
      speedRotX: number;
      speedRotY: number;
      floatSpeed: number;
      floatOffset: number;
      driftFactor: number;
    }>
  >([]);

  useEffect(() => {
    // Check mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();

    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotionRef.current = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    // Initialize cubes
    cubesRef.current = Array.from({ length: 7 }, (_, i) => ({
      x: 0.12 + (i * 0.13),
      y: 0.18 + ((i % 3) * 0.28) + (Math.sin(i * 1.5) * 0.08),
      size: 32 + (i % 4) * 14,
      rotX: i * 45,
      rotY: i * 30,
      speedRotX: 0.003 + (i % 3) * 0.002,
      speedRotY: 0.004 + (i % 2) * 0.002,
      floatSpeed: 0.0008 + (i % 3) * 0.0004,
      floatOffset: i * 1.2,
      driftFactor: 0.015 + (i % 3) * 0.01,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.targetX = e.clientX;
      mousePosRef.current.targetY = e.clientY;
    };

    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };

    const handleResize = () => {
      checkMobile();
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Main Canvas Render Loop (Perspective Floor Grid + Ledger Threads + Floating Blocks)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Threads setup
    const threadCount = isLanding ? 52 : isAuth ? 0 : 28;
    const threads = Array.from({ length: threadCount }, (_, i) => ({
      x: (i / threadCount) + (Math.random() * 0.02 - 0.01),
      y: Math.random(),
      speed: 0.0008 + Math.random() * 0.0018,
      depth: 0.4 + Math.random() * 0.6,
      isOrange: Math.random() < 0.12,
      chars: Array.from({ length: 6 }, () =>
        '0123456789abcdefABCDEF'[Math.floor(Math.random() * 22)]
      ),
      lastCharChange: 0,
      linkTarget: Math.random() < 0.25 ? Math.floor(Math.random() * threadCount) : -1,
    }));

    let gridOffset = 0;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      // Check visibility
      if (!isVisibleRef.current) return;

      // Track FPS for performance degradation check
      fpsRef.current.frames++;
      if (now - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.fps = (fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime);
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
        if (fpsRef.current.fps < 40) {
          fpsRef.current.lowFpsCount++;
          if (fpsRef.current.lowFpsCount > 2 && !reducedMode) {
            setReducedMode(true);
          }
        } else {
          fpsRef.current.lowFpsCount = 0;
        }
      }

      // Smooth mouse pos (lerp)
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.08;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.08;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${mousePosRef.current.x}px, ${mousePosRef.current.y}px, 0) translate(-50%, -50%)`;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (isReducedMotionRef.current) {
        // Reduced motion: draw simple static horizon grid and return
        ctx.strokeStyle = 'rgba(14, 104, 115, 0.20)';
        ctx.lineWidth = 1;
        const horizon = height * 0.42;
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        ctx.lineTo(width, horizon);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // ==========================================
      // LAYER B: Horizon Perspective Floor Grid
      // ==========================================
      const horizonY = height * 0.38;
      const fov = height * 0.65;
      gridOffset = (gridOffset + 0.0016) % 1;

      const mx = mousePosRef.current.x;
      const my = mousePosRef.current.y;

      // Vanishing point influenced slightly by mouse
      const vpX = width * 0.5 + (mx - width * 0.5) * 0.05;
      const vpY = horizonY;

      // 1. Horizontal lines moving forward
      const numHoriz = 16;
      for (let i = 0; i < numHoriz; i++) {
        // Perspective curve
        const progress = ((i / numHoriz) + gridOffset) % 1;
        const z = 1 - progress; // 1 is close, 0 is far at horizon
        const y = vpY + (height - vpY) * Math.pow(progress, 1.9);

        if (y < vpY || y > height) continue;

        // Opacity fades toward horizon
        const baseAlpha = 0.35 * Math.pow(progress, 1.4);
        
        // Boost if near mouse
        const distY = Math.abs(my - y);
        const mouseBoost = distY < 80 ? (1 - distY / 80) * 0.25 : 0;
        const alpha = Math.min(0.7, baseAlpha + mouseBoost);

        ctx.strokeStyle = `rgba(14, 104, 115, ${alpha.toFixed(3)})`;
        ctx.lineWidth = progress > 0.7 ? 1.5 : 1;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Perspective depth lines radiating from Vanishing Point
      const numRadial = 26;
      for (let i = -numRadial / 2; i <= numRadial / 2; i++) {
        const xBottom = width * 0.5 + i * (width / (numRadial * 0.65));
        
        // Line gradient fading near horizon
        const grad = ctx.createLinearGradient(vpX, vpY, xBottom, height);
        grad.addColorStop(0, 'rgba(14, 104, 115, 0)');
        grad.addColorStop(0.2, 'rgba(14, 104, 115, 0.05)');
        grad.addColorStop(1, 'rgba(14, 104, 115, 0.30)');

        // Distance to mouse near bottom
        const dist = Math.abs(mx - xBottom);
        const widthVal = dist < 120 ? 1.8 : 1;

        ctx.strokeStyle = grad;
        ctx.lineWidth = widthVal;

        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }

      // ==========================================
      // LAYER C: "Ledger Threads" (Vertical Data Streams)
      // ==========================================
      if (!isMobile && !reducedMode && !isAuth) {
        const threadAlphaFactor = isLanding ? 1 : 0.5; // calm on dashboard/app pages
        ctx.font = '10px "JetBrains Mono", monospace';

        threads.forEach((t, idx) => {
          t.y += t.speed;
          if (t.y > 1.2) {
            t.y = -0.15;
            t.x = Math.random();
          }

          if (now - t.lastCharChange > 180) {
            t.chars[Math.floor(Math.random() * t.chars.length)] =
              '0123456789abcdefABCDEF'[Math.floor(Math.random() * 22)];
            t.lastCharChange = now;
          }

          const streamX = t.x * width;
          const streamY = t.y * height;

          // Parallax scroll offset
          const parallaxY = streamY - (scrollYRef.current * (1 - t.depth) * 0.15) % height;

          const baseOpacity = t.isOrange
            ? 0.18 * threadAlphaFactor
            : 0.12 * threadAlphaFactor;

          // Connecting short glowing line between linked points
          if (t.linkTarget >= 0 && t.linkTarget < threads.length && idx % 4 === 0) {
            const targetT = threads[t.linkTarget];
            const targetX = targetT.x * width;
            const targetY = targetT.y * height;
            const d = Math.hypot(targetX - streamX, targetY - parallaxY);
            if (d < 160 && d > 20) {
              ctx.strokeStyle = t.isOrange
                ? `rgba(254, 126, 60, ${(0.15 * threadAlphaFactor).toFixed(2)})`
                : `rgba(14, 104, 115, ${(0.18 * threadAlphaFactor).toFixed(2)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(streamX, parallaxY);
              ctx.lineTo(targetX, targetY);
              ctx.stroke();

              // Mini hash square
              ctx.fillStyle = t.isOrange ? '#FE7E3C' : '#0E6873';
              ctx.fillRect(streamX - 1.5, parallaxY - 1.5, 3, 3);
            }
          }

          // Draw the falling glyphs
          t.chars.forEach((char, cIdx) => {
            const charY = parallaxY + cIdx * 14;
            if (charY < -10 || charY > height + 10) return;

            const charAlpha = baseOpacity * (1 - cIdx * 0.14);
            ctx.fillStyle = t.isOrange
              ? `rgba(254, 126, 60, ${charAlpha.toFixed(3)})`
              : `rgba(14, 104, 115, ${charAlpha.toFixed(3)})`;
            ctx.fillText(char, streamX, charY);
          });
        });
      }

      // ==========================================
      // LAYER D: Floating "Sealed Blocks" (Landing Desktop Only)
      // ==========================================
      if (isLanding && !isMobile && !reducedMode) {
        cubesRef.current.forEach((cube) => {
          cube.rotX += cube.speedRotX;
          cube.rotY += cube.speedRotY;
          cube.floatOffset += cube.floatSpeed;

          // Parallax on mouse and scroll (max 14px)
          const mouseDriftX = ((mx - width * 0.5) / width) * 14 * cube.driftFactor * 50;
          const mouseDriftY = ((my - height * 0.5) / height) * 14 * cube.driftFactor * 50;
          const scrollDriftY = ((scrollYRef.current * 0.05) % 20) * cube.driftFactor * 30;

          const cx = cube.x * width + mouseDriftX;
          const cy = cube.y * height + Math.sin(cube.floatOffset) * 12 + mouseDriftY - scrollDriftY;
          const s = cube.size;

          ctx.save();
          ctx.translate(cx, cy);

          // Translucent isometric wire cube with copper borders
          const cosX = Math.cos(cube.rotX);
          const sinX = Math.sin(cube.rotX);
          const cosY = Math.cos(cube.rotY);
          const sinY = Math.sin(cube.rotY);

          // Cube vertices
          const r = s * 0.5;
          const verts = [
            [-r, -r, -r],
            [r, -r, -r],
            [r, r, -r],
            [-r, r, -r],
            [-r, -r, r],
            [r, -r, r],
            [r, r, r],
            [-r, r, r],
          ].map(([vx, vy, vz]) => {
            // Y rotation
            const x1 = vx * cosY + vz * sinY;
            const z1 = -vx * sinY + vz * cosY;
            // X rotation
            const y2 = vy * cosX - z1 * sinX;
            return [x1, y2];
          });

          // Edges
          const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // back
            [4, 5], [5, 6], [6, 7], [7, 4], // front
            [0, 4], [1, 5], [2, 6], [3, 7], // connectors
          ];

          // Glass fill
          ctx.beginPath();
          ctx.moveTo(verts[4][0], verts[4][1]);
          ctx.lineTo(verts[5][0], verts[5][1]);
          ctx.lineTo(verts[6][0], verts[6][1]);
          ctx.lineTo(verts[7][0], verts[7][1]);
          ctx.closePath();
          ctx.fillStyle = 'rgba(14, 104, 115, 0.06)';
          ctx.fill();

          // Copper border stroke
          ctx.strokeStyle = 'rgba(97, 65, 60, 0.45)';
          ctx.lineWidth = 1.2;
          edges.forEach(([p1, p2]) => {
            ctx.beginPath();
            ctx.moveTo(verts[p1][0], verts[p1][1]);
            ctx.lineTo(verts[p2][0], verts[p2][1]);
            ctx.stroke();
          });

          // Core amber glowing centroid
          ctx.fillStyle = 'rgba(254, 126, 60, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isLanding, isAuth, isMobile, reducedMode]);

  // Color values for Risk Tint cross-fade
  const getRiskTintStyle = () => {
    switch (riskTint) {
      case 'danger':
        return {
          background: 'radial-gradient(circle at 50% 30%, rgba(228, 32, 27, 0.32) 0%, rgba(228, 32, 27, 0.08) 50%, transparent 80%)',
          opacity: 1,
        };
      case 'hold':
        return {
          background: 'radial-gradient(circle at 50% 30%, rgba(217, 83, 30, 0.28) 0%, rgba(217, 83, 30, 0.06) 50%, transparent 80%)',
          opacity: 1,
        };
      case 'warn':
        return {
          background: 'radial-gradient(circle at 50% 30%, rgba(254, 126, 60, 0.24) 0%, rgba(254, 126, 60, 0.05) 50%, transparent 80%)',
          opacity: 1,
        };
      case 'safe':
      default:
        return {
          background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0.02) 50%, transparent 80%)',
          opacity: 0.8,
        };
    }
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
    >
      {/* ==========================================
          LAYER A: Base Color + Slow Drifting Ambient Glows
          Drifting over 40s with ease-in-out
          ========================================== */}
      <div className="absolute inset-0 bg-[#1A2C30]" />

      {/* Top-Right Blue Lagoon Slow Drift Glow */}
      <div
        className="absolute -top-32 -right-32 w-[60rem] h-[55rem] rounded-full blur-[140px] pointer-events-none animate-drift-slow"
        style={{
          background: 'radial-gradient(circle, rgba(14, 104, 115, 0.55) 0%, rgba(14, 104, 115, 0.15) 55%, transparent 75%)',
        }}
      />

      {/* Bottom-Left Faint Burnt Orange Glow */}
      <div
        className="absolute -bottom-40 -left-40 w-[50rem] h-[45rem] rounded-full blur-[130px] pointer-events-none animate-drift-reverse"
        style={{
          background: 'radial-gradient(circle, rgba(254, 126, 60, 0.12) 0%, rgba(97, 65, 60, 0.08) 50%, transparent 70%)',
        }}
      />

      {/* Risk-Reactive Tint Glow Layer (cross-fades over 600ms) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-[600ms] ease-out"
        style={getRiskTintStyle()}
      />

      {/* ==========================================
          LAYERS B, C, D: Canvas Perspective Grid + Threads + Blocks
          ========================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Desktop Cursor Spotlight (480px soft orange-teal radial gradient with lerp) */}
      {!isMobile && (
        <div
          ref={spotlightRef}
          className="absolute top-0 left-0 w-[480px] h-[480px] rounded-full pointer-events-none blur-[60px] opacity-45 mix-blend-screen transition-opacity duration-300 will-change-transform"
          style={{
            transform: 'translate3d(-1000px, -1000px, 0) translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(254, 126, 60, 0.18) 0%, rgba(14, 104, 115, 0.22) 45%, transparent 70%)',
          }}
        />
      )}

      {/* Admin Route Scan Line (Sweeps top to bottom every 8s) */}
      {isAdmin && (
        <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#E4201B]/35 to-transparent blur-sm pointer-events-none animate-scanline-8s" />
      )}

      {/* ==========================================
          LAYER E: Finishing Film-Grain Noise + Soft Vignette
          ========================================== */}
      {/* 4% Opacity Film-Grain Noise */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft Vignette (Transparent Center -> Black Pearl Edges) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(26, 44, 48, 0.6) 80%, rgba(26, 44, 48, 0.95) 100%)',
        }}
      />
    </div>
  );
}

export default SiteBackground;
