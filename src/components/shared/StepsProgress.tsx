'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Step {
  label: string;
  href: string;
  adminOnly?: boolean;
}

interface StepsProgressProps {
  currentStep: number;        // 1-5 (1-indexed)
  steps?: Step[];             // Optional, uses DEFAULT_STEPS if not provided
  className?: string;         // Optional CSS class
}

const DEFAULT_STEPS: Step[] = [
  { label: 'Tournament Setup', href: '/manage/tournaments' },
  { label: 'Teams Setup', href: '/manage/teams' },
  { label: 'Players Setup', href: '/manage/players' },
  { label: 'Overlay / Output', href: '/output' },
  { label: 'Auction Control', href: '/auction' },
];

const getStepStatus = (index: number, currentIndex: number) => {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'active';
  return 'pending';
};

/** Map step index to the same 0–100% scale used by the progress track. */
function getStepProgressPosition(index: number, totalSteps: number): number {
  if (totalSteps <= 1) return 0;
  return (index / (totalSteps - 1)) * 100;
}

export default function StepsProgress({ currentStep, steps = DEFAULT_STEPS, className = '' }: StepsProgressProps) {
  const stepCount = steps.length;
  const currentStepIndex = Math.min(Math.max(currentStep - 1, 0), stepCount - 1);
  const progressPercentage = getStepProgressPosition(currentStepIndex, stepCount);
  const [renderedWidth, setRenderedWidth] = useState(progressPercentage);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRenderedWidth(progressPercentage));
    return () => cancelAnimationFrame(frame);
  }, [progressPercentage]);

  // Half the circle width so step 1 / step N sit on the track endpoints without clipping.
  return (
    <div className={`w-full py-3 sm:py-4 min-w-0 ${className}`}>
      <div className="relative w-full px-3.5 sm:px-4">

        {/* Row height = circle + room for tooltips below */}
        <div className="relative h-7 sm:h-8 mb-12 sm:mb-14">
          {/* Background track — spans between first and last circle centers */}
          <div
            className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full z-0"
            style={{ backgroundColor: 'var(--border-primary)' }}
          />

          {/* Active progress — same scale as circle positions */}
          <div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out z-0"
            style={{
              width: `${renderedWidth}%`,
              backgroundColor: 'var(--brand-primary)',
            }}
          />

          {/* Steps — absolutely positioned on the shared percentage scale */}
          {steps.map((step, index) => {
            const status = getStepStatus(index, currentStepIndex);
            const isActiveOrCompleted = status === 'active' || status === 'completed';
            const leftPercent = getStepProgressPosition(index, stepCount);

            return (
              <Link
                key={step.href}
                href={step.href}
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${leftPercent}%` }}
                aria-current={status === 'active' ? 'step' : undefined}
              >
                {/* Numbered circle */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all duration-300 ${
                    isActiveOrCompleted
                      ? 'text-white scale-110'
                      : 'text-[var(--text-tertiary)]'
                  } ${status === 'active' ? 'ring-4' : ''}`}
                  style={{
                    backgroundColor: isActiveOrCompleted
                      ? 'var(--brand-primary)'
                      : 'var(--surface-elevated)',
                    borderColor: isActiveOrCompleted
                      ? 'var(--brand-primary)'
                      : 'var(--border-primary)',
                    ...(status === 'active' && {
                      '--tw-ring-color': 'color-mix(in oklab, var(--brand-primary) 20%, transparent)',
                    } as React.CSSProperties),
                  }}
                >
                  {index + 1}
                </div>

                {/* Tooltip — hover on md+, always visible on active step */}
                <div
                  className={`absolute left-1/2 top-[calc(100%+0.75rem)] sm:top-[calc(100%+1rem)] px-3 py-2 rounded-lg backdrop-blur-md shadow-lg border transition-all duration-300 -translate-x-1/2 hidden md:block ${
                    status === 'active'
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                  }`}
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-t border-l"
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderColor: 'var(--border-primary)',
                    }}
                  />
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
