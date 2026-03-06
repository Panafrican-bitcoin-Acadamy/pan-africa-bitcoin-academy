'use client';

import { useEffect, useRef, useState } from 'react';
import './TrueFocus.css';

export interface TrueFocusProps {
  sentence: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  /** If set, only these word indices get the focus cycle (e.g. [1, 3] for "Bailouts" and "Blockchain"). */
  focusOnlyIndices?: number[];
  className?: string;
}

export function TrueFocus({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = 'green',
  glowColor = 'rgba(0, 255, 0, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  focusOnlyIndices,
  className = '',
}: TrueFocusProps) {
  const words = sentence.split(separator);
  const cycleIndices =
    focusOnlyIndices ?? words.map((_, i) => i);
  const [cycleIndex, setCycleIndex] = useState(0);
  const currentIndex = cycleIndices[cycleIndex] ?? 0;
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [frameVisible, setFrameVisible] = useState(false);

  useEffect(() => {
    if (!manualMode && cycleIndices.length > 0) {
      const interval = setInterval(
        () => {
          setCycleIndex((prev) => (prev + 1) % cycleIndices.length);
        },
        (animationDuration + pauseBetweenAnimations) * 1000
      );
      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, cycleIndices.length]);

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= words.length) return;
    const el = wordRefs.current[currentIndex];
    const container = containerRef.current;
    if (!el || !container) return;

    const parentRect = container.getBoundingClientRect();
    const activeRect = el.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
    setFrameVisible(true);
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      const idx = cycleIndices.indexOf(index);
      if (idx !== -1) {
        setLastActiveIndex(cycleIndex);
        setCycleIndex(idx);
      }
    }
  };

  const handleMouseLeave = () => {
    if (manualMode && lastActiveIndex !== null) {
      setCycleIndex(lastActiveIndex);
    }
  };

  return (
    <span
      className={`focus-container ${className}`.trim()}
      ref={containerRef}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        const inCycle = focusOnlyIndices == null || focusOnlyIndices.includes(index);
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''}`}
            style={{
              filter:
                manualMode
                  ? isActive
                    ? 'blur(0px)'
                    : `blur(${blurAmount}px)`
                  : inCycle
                    ? isActive
                      ? 'blur(0px)'
                      : `blur(${blurAmount}px)`
                    : 'blur(0px)',
              ['--border-color' as string]: borderColor,
              ['--glow-color' as string]: glowColor,
              transition: `filter ${animationDuration}s ease`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <div
        className="focus-frame"
        style={{
          transform: `translate(${focusRect.x}px, ${focusRect.y}px)`,
          width: focusRect.width,
          height: focusRect.height,
          opacity: frameVisible && currentIndex >= 0 ? 1 : 0,
          ['--border-color' as string]: borderColor,
          ['--glow-color' as string]: glowColor,
          transition: `transform ${animationDuration}s ease, width ${animationDuration}s ease, height ${animationDuration}s ease, opacity ${animationDuration}s ease`,
        }}
      >
        <span className="corner top-left" />
        <span className="corner top-right" />
        <span className="corner bottom-left" />
        <span className="corner bottom-right" />
      </div>
    </span>
  );
}

export default TrueFocus;
