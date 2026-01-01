import type { ReactNode } from "react";

type PageContainerProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function PageContainer({ title, subtitle, children }: PageContainerProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-black text-zinc-50 w-full">
      {/* Full width on mobile, max-width only on larger screens */}
      <main className="relative z-10 w-full flex flex-1 flex-col overflow-hidden px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8 sm:max-w-6xl sm:mx-auto lg:px-12 lg:pb-16 lg:pt-10 xl:px-20 xl:px-24">
        {/* Subtle peripheral framing - moved far to edges, reduced by 70% */}
        <div className="pointer-events-none fixed -left-96 -top-96 h-[600px] w-[600px] rounded-full bg-cyan-500/3 blur-3xl" />
        <div className="pointer-events-none fixed -right-96 top-0 h-[500px] w-[500px] rounded-full bg-orange-500/3 blur-3xl" />
        <div className="pointer-events-none fixed -bottom-96 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-purple-500/2 blur-3xl" />
        
        {title ? (
          <header className="relative mb-8 space-y-3 sm:mb-12 z-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-300/60">
              Bitcoin · Learning Path
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="w-full text-sm text-zinc-400 sm:text-base sm:max-w-3xl lg:text-lg">
                {subtitle}
              </p>
            ) : null}
          </header>
        ) : null}
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}


