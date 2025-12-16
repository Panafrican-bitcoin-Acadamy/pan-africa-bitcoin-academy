import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-cyan-400/15 bg-black/80 text-[11px] text-zinc-500 backdrop-blur-xl sm:text-xs">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo and Brand Section */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <Image
                  src="/images/logo_3.png"
                  alt="Pan-African Bitcoin Academy Logo"
                  width={48}
                  height={48}
                  className="object-contain brightness-110 contrast-125 saturate-120"
                  quality={95}
                  sizes="48px"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Pan-African
                </span>
                <span className="text-sm font-medium text-zinc-100">Bitcoin Academy</span>
              </div>
            </Link>
          </div>
          
          {/* Links Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col gap-2">
              <p className="font-medium text-zinc-300 mb-2">Quick Links</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] sm:gap-4 sm:text-xs">
                <Link
                  href="/chapters"
                  className="text-zinc-400 transition hover:text-cyan-300"
                  title="Bitcoin tutorials for beginners"
                >
                  Learn Bitcoin
                </Link>
                <Link
                  href="/about"
                  className="text-zinc-400 transition hover:text-cyan-300"
                  title="About PanAfrican Bitcoin Academy"
                >
                  About
                </Link>
                <Link
                  href="/blog"
                  className="text-zinc-400 transition hover:text-cyan-300"
                  title="Bitcoin blog and articles"
                >
                  Blog
                </Link>
                <Link
                  href="/developer-hub"
                  className="text-zinc-400 transition hover:text-cyan-300"
                  title="Bitcoin developer resources"
                >
                  Developer Hub
                </Link>
                <Link
                  href="/faq"
                  className="text-zinc-400 transition hover:text-cyan-300"
                  title="Frequently asked questions"
                >
                  FAQ
                </Link>
                <Link
                  href="/donate"
                  className="text-zinc-400 transition hover:text-orange-300"
                  title="Support Bitcoin education"
                >
                  Donate
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-6 flex flex-col gap-2 border-t border-cyan-400/10 pt-4">
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
      </div>
    </footer>
  );
}


