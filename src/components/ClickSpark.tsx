'use client';

import { useCallback, useRef, type ReactNode } from 'react';

export interface ClickSparkProps {
  children: ReactNode;
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
}

function ClickSpark({
  children,
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
}: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<HTMLDivElement | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let sparksEl = sparksRef.current;
      if (!sparksEl) {
        sparksEl = document.createElement('div');
        sparksEl.setAttribute('aria-hidden', 'true');
        sparksEl.style.cssText =
          'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
        container.style.position = 'relative';
        container.appendChild(sparksEl);
        sparksRef.current = sparksEl;
      }

      for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const dist = sparkRadius * (0.6 + Math.random() * 0.4);
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        const dot = document.createElement('div');
        dot.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: ${sparkSize}px;
          height: ${sparkSize}px;
          margin-left: -${sparkSize / 2}px;
          margin-top: -${sparkSize / 2}px;
          background: ${sparkColor};
          border-radius: 50%;
          opacity: 0.9;
          transform: translate(0, 0);
          transition: none;
        `;

        sparksEl.appendChild(dot);

        requestAnimationFrame(() => {
          dot.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
          dot.style.transform = `translate(${tx}px, ${ty}px)`;
          dot.style.opacity = '0';
        });

        setTimeout(() => {
          dot.remove();
        }, duration + 50);
      }
    },
    [sparkColor, sparkSize, sparkRadius, sparkCount, duration]
  );

  return (
    <div ref={containerRef} onClick={handleClick} style={{ cursor: 'default' }}>
      {children}
    </div>
  );
}

export { ClickSpark };
export default ClickSpark;
