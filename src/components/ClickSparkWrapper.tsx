'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const ClickSpark = dynamic(() => import('@/components/ClickSpark'), { ssr: false });

export function ClickSparkWrapper({ children }: { children: ReactNode }) {
  return (
    <ClickSpark
      sparkColor="#fff"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      {children}
    </ClickSpark>
  );
}
