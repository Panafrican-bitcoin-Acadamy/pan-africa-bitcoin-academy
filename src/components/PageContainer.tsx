import type { ReactNode } from "react";

type PageContainerProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function PageContainer({ title, subtitle, children }: PageContainerProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent text-zinc-50 bitcoin-bg-pattern">
      <div className="bitcoin-network-lines" />
      <main className="bg-grid relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden pl-8 pr-4 pb-12 pt-8 sm:pl-12 sm:pr-6 sm:pb-16 sm:pt-10 lg:pl-16 lg:pr-8">
        {/* Bitcoin-themed background elements */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-32 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-500/5 blur-3xl" />
        
        {title ? (
          <header className="relative mb-8 space-y-3 sm:mb-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-300/80">
              Bitcoin · Learning Path
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-3xl text-sm text-zinc-400 sm:text-base lg:text-lg">
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


