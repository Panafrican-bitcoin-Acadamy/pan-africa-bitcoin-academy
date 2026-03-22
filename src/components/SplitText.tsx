'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'chars words' | 'words chars';
  from?: { opacity?: number; y?: number; x?: number };
  to?: { opacity?: number; y?: number; x?: number };
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
  tag?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3';
  onLetterAnimationComplete?: () => void;
  showCallback?: boolean;
}

function splitTextIntoElements(
  el: HTMLElement,
  splitType: string
): HTMLElement[] {
  const text = el.textContent ?? '';
  el.innerHTML = '';
  el.style.overflow = 'hidden';

  if (splitType.includes('chars') && !splitType.includes('words')) {
    const chars = text.split('').map((char) => (char === ' ' ? '\u00A0' : char));
    return chars.map((char) => {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.style.display = 'inline-block';
      span.textContent = char;
      el.appendChild(span);
      return span;
    });
  }

  if (splitType.includes('words') && !splitType.includes('chars')) {
    const words = text.split(/(\s+)/).filter(Boolean);
    return words.map((word) => {
      const span = document.createElement('span');
      span.className = 'split-word';
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'pre';
      span.textContent = word;
      el.appendChild(span);
      return span;
    });
  }

  // Default: chars
  const chars = text.split('').map((char) => (char === ' ' ? '\u00A0' : char));
  return chars.map((char) => {
    const span = document.createElement('span');
    span.className = 'split-char';
    span.style.display = 'inline-block';
    span.textContent = char;
    el.appendChild(span);
    return span;
  });
}

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag: Tag = 'p',
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const ref = useRef<HTMLElement>(null);
  const animationCompletedRef = useRef(false);
  const splitInstanceRef = useRef<{ revert: () => void } | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current;

      // Revert previous split if any
      if (splitInstanceRef.current) {
        try {
          splitInstanceRef.current.revert();
        } catch (_) {
          /* noop */
        }
        splitInstanceRef.current = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      const targets = splitTextIntoElements(el, splitType);
      if (targets.length === 0) return;

      splitInstanceRef.current = {
        revert: () => {
          el.innerHTML = text;
          el.style.overflow = '';
          el.style.display = '';
          el.style.whiteSpace = '';
          el.style.wordWrap = '';
          el.style.willChange = '';
          targets.forEach((t) => t.remove());
        },
      };

      const tween = gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            fastScrollEnd: true,
            anticipatePin: 0.4,
          },
          onComplete: () => {
            animationCompletedRef.current = true;
            onCompleteRef.current?.();
          },
          willChange: 'transform, opacity',
          force3D: true,
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
        try {
          tween.kill();
          splitInstanceRef.current?.revert();
        } catch (_) {
          /* noop */
        }
        splitInstanceRef.current = null;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
      ],
      scope: ref,
    }
  );

  const style: React.CSSProperties = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
    /* Prevent descenders / bounce animation from being clipped at the bottom */
    paddingTop: '0.08em',
    paddingBottom: '0.22em',
    lineHeight: 1.15,
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      style={style}
      className={`split-parent ${className}`.trim()}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
