'use client';

import React from 'react';

/**
 * Minimal background animation with floating particles
 * Uses pure CSS for performance
 */
const BackgroundAnimation: React.FC = () => {
  // Generate 15 particles with random positions and delays
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2, // 2-6px
    left: Math.random() * 100, // 0-100%
    top: Math.random() * 100, // 0-100%
    delay: Math.random() * 20, // 0-20s
    duration: Math.random() * 20 + 20, // 20-40s
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800" />

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 animate-gradient-shift" />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-brand-primary/20 animate-float-particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
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
