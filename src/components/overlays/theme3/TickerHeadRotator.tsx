'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TickerHeadSlide } from './tickerHeadSlides';

const HEAD_SLIDE_MS = 420;
const TITLE_FONT_SIZE = 22;
/** Approximate head panel width at 1920 canvas (22% minus padding). */
const HEAD_PANEL_EST_WIDTH = 1920 * 0.22 - 24;

function estimateNameOverflow(label: string): boolean {
  return label.length * 14 > HEAD_PANEL_EST_WIDTH;
}

function getSlideDwellMs(slide: TickerHeadSlide, nameMarquee: boolean): number {
  if (slide.type === 'logo') return 4000;
  if (slide.id === 'tournament-name') return nameMarquee ? 6000 : 5000;
  return 3500;
}

function logoMaxHeight(barHeight: number): number {
  return Math.min(58, barHeight - 12);
}

const textBaseStyle: React.CSSProperties = {
  fontFamily: "'Lato', sans-serif",
  fontWeight: 700,
  fontSize: TITLE_FONT_SIZE,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--t3-text-primary, rgb(230,230,230))',
  lineHeight: 1.1,
};

interface TickerHeadRotatorProps {
  slides: TickerHeadSlide[];
  active: boolean;
  height: number;
}

function StaticTextSlide({ label }: { label: string }) {
  return (
    <span
      style={{
        ...textBaseStyle,
        textAlign: 'center',
        padding: '0 10px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}
    >
      {label}
    </span>
  );
}

function CenteredTextSlide({ label }: { label: string }) {
  return (
    <span
      style={{
        ...textBaseStyle,
        textAlign: 'center',
        padding: '0 10px',
        whiteSpace: 'nowrap',
        display: 'block',
        width: '100%',
      }}
    >
      {label}
    </span>
  );
}

/** Tournament name — horizontal marquee when text exceeds panel width. */
function TournamentNameSlide({ label, height }: { label: string; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [marquee, setMarquee] = useState(false);
  const [scrollDuration, setScrollDuration] = useState(18);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const containerWidth = container.clientWidth;
    const textWidth = measure.scrollWidth;
    const overflow = textWidth > containerWidth - 16;
    setOverflows(overflow);
    setMarquee(overflow && !reducedMotion);
    if (overflow) {
      setScrollDuration(Math.max(15, Math.min(20, textWidth / 28)));
    }
  }, [label, height, reducedMotion]);

  if (!marquee) {
    const TextSlide = reducedMotion && overflows ? StaticTextSlide : CenteredTextSlide;
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          padding: '0 10px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          ref={measureRef}
          style={{
            ...textBaseStyle,
            visibility: 'hidden',
            position: 'absolute',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <TextSlide label={label} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes t3HeadNameMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          boxSizing: 'border-box',
        }}
      >
        <span ref={measureRef} style={{ ...textBaseStyle, visibility: 'hidden', position: 'absolute', pointerEvents: 'none' }}>
          {label}
        </span>
        <div
          style={{
            whiteSpace: 'nowrap',
            animation: `t3HeadNameMarquee ${scrollDuration}s linear infinite`,
          }}
        >
          <span style={{ ...textBaseStyle, paddingRight: 48 }}>{label}</span>
          <span style={{ ...textBaseStyle, paddingRight: 48 }}>{label}</span>
        </div>
      </div>
    </>
  );
}

function LogoHeroSlide({
  slide,
  height,
  onError,
}: {
  slide: Extract<TickerHeadSlide, { type: 'logo' }>;
  height: number;
  onError: () => void;
}) {
  const maxH = logoMaxHeight(height);
  return (
    <div
      style={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '92%',
          maxHeight: maxH + 8,
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid var(--t3-border-accent, rgba(0,137,140,0.45))',
          boxShadow: 'inset 0 0 12px rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.35)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <img
          src={slide.src}
          alt=""
          onError={onError}
          style={{
            maxHeight: maxH,
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}

function SlideRenderer({
  slide,
  height,
  onImageError,
}: {
  slide: TickerHeadSlide;
  height: number;
  onImageError: (id: string) => void;
}) {
  if (slide.type === 'logo') {
    return (
      <LogoHeroSlide slide={slide} height={height} onError={() => onImageError(slide.id)} />
    );
  }
  if (slide.id === 'tournament-name') {
    return <TournamentNameSlide label={slide.label} height={height} />;
  }
  return <StaticTextSlide label={slide.label} />;
}

/** Rotates ticker head: mode label → tournament name → logos. */
export function TickerHeadRotator({ slides, active, height }: TickerHeadRotatorProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(() => new Set());
  const reducedMotionRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleSlides = useMemo(
    () => slides.filter(s => !brokenIds.has(s.id)),
    [slides, brokenIds],
  );

  useEffect(() => {
    if (slideIndex >= visibleSlides.length) {
      setSlideIndex(0);
    }
  }, [visibleSlides.length, slideIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => { reducedMotionRef.current = mq.matches; };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!active || visibleSlides.length <= 1) return;

    const idx = slideIndex % visibleSlides.length;
    const currentSlide = visibleSlides[idx];
    const nameMarquee =
      currentSlide?.type === 'text' &&
      currentSlide.id === 'tournament-name' &&
      estimateNameOverflow(currentSlide.label);
    const dwell = getSlideDwellMs(currentSlide, nameMarquee);

    timerRef.current = setTimeout(() => {
      if (reducedMotionRef.current) {
        setSlideIndex(p => (p + 1) % visibleSlides.length);
        return;
      }
      setSliding(true);
      setTimeout(() => {
        setSlideIndex(p => (p + 1) % visibleSlides.length);
        setSliding(false);
      }, HEAD_SLIDE_MS);
    }, dwell);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, slideIndex, visibleSlides]);

  const handleImageError = (id: string) => {
    setBrokenIds(prev => new Set(prev).add(id));
  };

  if (visibleSlides.length === 0) {
    return <StaticTextSlide label="PROSTREAM" />;
  }

  if (visibleSlides.length === 1) {
    return (
      <SlideRenderer slide={visibleSlides[0]} height={height} onImageError={handleImageError} />
    );
  }

  const current = visibleSlides[slideIndex % visibleSlides.length];
  const next = visibleSlides[(slideIndex + 1) % visibleSlides.length];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: height * 2,
          transform: sliding ? `translateY(-${height}px)` : 'translateY(0)',
          transition: sliding
            ? `transform ${HEAD_SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : 'none',
        }}
      >
        {[current, next].map((slide, i) => (
          <div
            key={`${slide.id}-${i}`}
            style={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              flexShrink: 0,
            }}
          >
            <SlideRenderer slide={slide} height={height} onImageError={handleImageError} />
          </div>
        ))}
      </div>
    </div>
  );
}
