'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Step {
  label: string;
  href: string;
}

interface StepsProgressProps {
  currentStep: number;        // 1-6 (1-indexed)
  steps?: Step[];             // Optional, uses DEFAULT_STEPS if not provided
  className?: string;         // Optional CSS class
}

const DEFAULT_STEPS: Step[] = [
  { label: 'Setup Tournament', href: '/manage/tournaments' },
  { label: 'Setup Team', href: '/manage/teams' },
  { label: 'Setup Players', href: '/manage/players' },
  { label: 'Setup Auction', href: '/auction/setup' },
  { label: 'Add Overlays to OBS', href: '/overlays' },
  { label: 'Start Auction', href: '/auction' },
];

const getStepStatus = (index: number, currentIndex: number) => {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'active';
  return 'pending';
};

export default function StepsProgress({ currentStep, steps = DEFAULT_STEPS, className = '' }: StepsProgressProps) {
  // Convert 1-indexed to 0-indexed
  const currentStepIndex = currentStep - 1;
  const progressPercentage = (currentStepIndex / (steps.length - 1)) * 100;
  const [renderedWidth, setRenderedWidth] = useState(progressPercentage);

  useEffect(() => {
    // Try to animate from the previous step (even across page remounts) using sessionStorage as a handoff
    let startWidth = progressPercentage;

    try {
      const storedStep = Number(sessionStorage.getItem('stepsProgress:lastStep'));
      if (!Number.isNaN(storedStep)) {
        const prevIndex = Math.max(0, Math.min(storedStep - 1, steps.length - 1));
        startWidth = (prevIndex / (steps.length - 1)) * 100;
      }
      sessionStorage.setItem('stepsProgress:lastStep', String(currentStep));
    } catch {
      // Ignore storage issues and fall back to the current step width
    }

    setRenderedWidth(startWidth);

    // Defer setting the final width to trigger the animation frame
    const frame = requestAnimationFrame(() => setRenderedWidth(progressPercentage));
    return () => cancelAnimationFrame(frame);
  }, [progressPercentage, currentStep, steps.length]);

  return (
    <div className={`w-full py-4 px-4 ${className}`}>
      <div className="relative">
        {/* Background Progress Track */}
        <div
          className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full z-0"
          style={{ backgroundColor: 'var(--border-primary)' }}
        />

        {/* Active Progress Bar */}
        <div
          className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out z-0"
          style={{
            width: `${renderedWidth}%`,
            backgroundColor: 'var(--brand-primary)'
          }}
        />

        {/* Steps Container */}
        <div className="relative flex justify-between w-full z-10">
          {steps.map((step, index) => {
            const status = getStepStatus(index, currentStepIndex);
            const isActiveOrCompleted = status === 'active' || status === 'completed';

            return (
              <Link
                key={index}
                href={step.href}
                className="relative flex flex-col items-center group cursor-pointer"
              >
                {/* Numbered Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    isActiveOrCompleted
                      ? 'text-white scale-110'
                      : 'text-[var(--text-tertiary)]'
                  } ${status === 'active' ? 'ring-4' : ''}`}
                  style={{
                    backgroundColor: status === 'completed'
                      ? 'var(--brand-primary)'
                      : status === 'active'
                      ? 'var(--brand-primary)'
                      : 'var(--surface-elevated)',
                    borderColor: status === 'completed'
                      ? 'var(--brand-primary)'
                      : status === 'active'
                      ? 'var(--brand-primary)'
                      : 'var(--border-primary)',
                    ...(status === 'active' && {
                      '--tw-ring-color': 'color-mix(in oklab, var(--brand-primary) 20%, transparent)'
                    } as React.CSSProperties)
                  }}
                >
                  {index + 1}
                </div>

                {/* Floating Tooltip */}
                <div
                  className={`absolute top-14 px-3 py-2 rounded-lg backdrop-blur-md shadow-lg border transition-all duration-300 transform -translate-x-1/2 left-1/2 ${
                    status === 'active'
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                  }`}
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  {/* Tooltip Arrow */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-t border-l"
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderColor: 'var(--border-primary)'
                    }}
                  />

                  {/* Label Text */}
                  <p
                    className="text-xs font-bold whitespace-nowrap"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {step.label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
