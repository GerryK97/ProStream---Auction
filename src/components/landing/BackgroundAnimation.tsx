'use client';

import React, { useMemo } from 'react';

/**
 * Minimal background animation with floating particles
 * Disables intensive effects when prefers-reduced-motion is enabled
 */
const BackgroundAnimation: React.FC = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 20,
        duration: Math.random() * 20 + 20,
      })),
    []
  );

  const backgroundImageUrl =
    'https://res.cloudinary.com/diitsd6nz/image/upload/v1763443715/2151954720_hbmhqc.jpg';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Photo Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />

      {/* Neutral wash for desktop separation */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-neutral-950/85 via-neutral-900/65 to-neutral-950/85 lg:block" />

      {/* Gradient Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/88 via-neutral-950/65 to-neutral-950/95" />

      {/* Radial highlight for hero focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(79,70,229,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(2,132,199,0.24),transparent_50%)]" />

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-brand-secondary/25 motion-reduce:opacity-60 motion-safe:animate-gradient-shift" />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-brand-primary/20 motion-safe:animate-float-particle motion-reduce:hidden"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Grid Pattern Overlay (very subtle) */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(79, 70, 229, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 70, 229, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

export default BackgroundAnimation;
