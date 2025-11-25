'use client';

import Link from 'next/link';
import React from 'react';

type Step = { label: string; href: string };

const DEFAULT_STEPS: Step[] = [
  { label: 'Setup Tournament', href: '/manage/tournaments' },
  { label: 'Setup Team', href: '/manage/teams' },
  { label: 'Setup Players', href: '/manage/players' },
  { label: 'Setup Auction', href: '/auction/setup' },
  { label: 'Add Overlays to OBS', href: '/overlays' },
  { label: 'Start Auction', href: '/auction' },
];

interface StepsProgressProps {
  currentStep: number; // 1..6
  steps?: Step[];
  className?: string;
}

export default function StepsProgress({ currentStep, steps = DEFAULT_STEPS, className = '' }: StepsProgressProps) {
  const safeCurrent = Math.min(Math.max(currentStep, 1), steps.length);

  return (
    <nav aria-label="Auction steps" className={`steps-tube ${className}`.trim()}>
      <ol className="steps-tube__grid">
        {steps.map((step, idx) => {
          const index = idx + 1;
          const completed = index < safeCurrent;
          const active = index === safeCurrent;
          return (
            <li key={step.href} className={`tube-wrap ${completed ? 'step--completed' : ''} ${active ? 'step--active' : ''}`.trim()}>
              <div className="tube" aria-hidden />
              <Link href={step.href} aria-current={active ? 'step' : undefined} className="circle">
                {completed ? (
                  <svg viewBox="0 0 24 24" className="step__check" aria-hidden>
                    <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index
                )}
              </Link>
              <Link href={step.href} className="step__label">{step.label}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

