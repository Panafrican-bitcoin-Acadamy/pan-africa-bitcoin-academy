import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-cyan-400/15 bg-black/80 text-[11px] text-zinc-500 backdrop-blur-xl sm:text-xs">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <p>
              Built by{" "}
              <a
                href="https://github.com/Joie199"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                Joie
              </a>{" "}
              for curious minds exploring <span className="font-semibold text-cyan-300">Bitcoin</span>.
            </p>
            <p className="text-[10px] text-zinc-500 sm:text-[11px]">
              Educational only. Not financial advice. Practice on testnet/regtest, never with
              money you can&apos;t lose.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] sm:gap-4 sm:text-xs">
            <Link
              href="/faq"
              className="text-zinc-400 transition hover:text-cyan-300"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              className="text-zinc-400 transition hover:text-cyan-300"
            >
              About
            </Link>
            <Link
              href="/donate"
              className="text-zinc-400 transition hover:text-orange-300"
            >
              Donate
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


