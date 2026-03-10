'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CustomTickerOverlayProps {
    line1: string;
    line2: string;
}

const CustomTickerOverlay: React.FC<CustomTickerOverlayProps> = ({ line1, line2 }) => {
    const lines = [line1, line2].filter(l => l.trim() !== '');
    const [activeIndex, setActiveIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const linesRef = useRef(lines);

    useEffect(() => {
        linesRef.current = lines;
        // Reset to index 0 if current index is out of range
        setActiveIndex(prev => (lines.length > 0 ? prev % lines.length : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [line1, line2]);

    useEffect(() => {
        if (lines.length <= 1) return;

        const timer = setInterval(() => {
            setFading(true);
            const timeout = setTimeout(() => {
                setActiveIndex(prev => (prev + 1) % linesRef.current.length);
                setFading(false);
            }, 600);
            return () => clearTimeout(timeout);
        }, 5000);

        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines.length]);

    const displayText = lines.length > 0 ? lines[activeIndex % lines.length] : '';

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 32,
            }}
        >
            {/* Label */}
            <div
                style={{
                    fontFamily: '"Graduate", cursive',
                    fontSize: 22,
                    color: 'rgba(255,255,255,0.28)',
                    letterSpacing: 10,
                    textTransform: 'uppercase',
                    lineHeight: 1,
                }}
            >
                CUSTOM MESSAGE
            </div>

            {/* Horizontal accent line */}
            <div
                style={{
                    width: 1200,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent 0%, #FFC919 30%, #FFC919 70%, transparent 100%)',
                    opacity: 0.35,
                }}
            />

            {/* Main flipping text */}
            <div
                style={{
                    opacity: fading ? 0 : 1,
                    transition: 'opacity 0.6s ease',
                    fontSize: 110,
                    color: '#FFC919',
                    fontFamily: '"Inconsolata", monospace',
                    fontWeight: 700,
                    textAlign: 'center',
                    padding: '0 160px',
                    lineHeight: 1.25,
                    letterSpacing: 4,
                    textShadow: '0 0 60px rgba(255,201,25,0.45), 0 0 120px rgba(255,201,25,0.2)',
                    maxWidth: 1600,
                    wordBreak: 'break-word',
                }}
            >
                {displayText || (
                    <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 48, letterSpacing: 6 }}>
                        No text set
                    </span>
                )}
            </div>

            {/* Horizontal accent line */}
            <div
                style={{
                    width: 1200,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent 0%, #FFC919 30%, #FFC919 70%, transparent 100%)',
                    opacity: 0.35,
                }}
            />

            {/* Page dots — only if 2 lines */}
            {lines.length > 1 && (
                <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    {lines.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: i === activeIndex % lines.length ? 28 : 10,
                                height: 10,
                                borderRadius: 5,
                                background: i === activeIndex % lines.length ? '#FFC919' : 'rgba(255,255,255,0.2)',
                                transition: 'width 0.4s ease, background 0.4s ease',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomTickerOverlay;
