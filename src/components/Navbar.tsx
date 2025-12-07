import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-cyan-400/20 bg-black/70 text-zinc-50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-xl bg-gradient-to-tr from-orange-500 via-cyan-400 to-purple-500 shadow-[0_0_30px_rgba(56,189,248,0.7)]">
            <div className="absolute inset-[3px] rounded-lg bg-black/80" />
            <div className="absolute inset-[7px] rounded-[6px] border border-cyan-400/60" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Bitcoin
            </span>
            <span className="text-sm font-medium text-zinc-100">Learning Hub</span>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-300 sm:gap-4 sm:text-xs">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Home
          </Link>
          <Link
            href="/chapters"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Chapters
          </Link>
          <Link
            href="/apply"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Apply
          </Link>
          <Link
            href="/mentorship"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Mentorship
          </Link>
          <Link
            href="/impact"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Impact
          </Link>
          <Link
            href="/donate"
            className="rounded-full bg-gradient-to-r from-orange-400/20 to-cyan-400/20 px-3 py-1.5 text-orange-300 transition hover:from-orange-400/30 hover:to-cyan-400/30"
          >
            Donate
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}


