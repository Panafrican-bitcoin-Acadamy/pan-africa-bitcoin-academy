import Link from "next/link";
import Image from "next/image";
import { FooterAnimated } from "@/components/FooterAnimated";

export function Footer() {
  return (
    <footer className="relative border-t border-cyan-400/15 bg-black/90 backdrop-blur-xl w-full overflow-hidden">
      {/* Large Bitcoin ₿ background watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden" aria-hidden="true">
        <svg
          className="h-[600px] w-[600px] -mr-20 sm:-mr-10 lg:mr-10 opacity-[0.15]"
          viewBox="0 0 64 64"
          fill="none"
        >
          <circle cx="32" cy="32" r="31" stroke="url(#footer-btc-grad)" strokeWidth="2" />
          <path
            d="M25 15h3v4h4v-4h3v4c3.9.4 7 2.2 7 6.2 0 2.8-1.5 4.6-3.8 5.5 3 .8 5.3 3 5.3 6.3 0 4.5-3.6 6.8-8 7.2V44h-3v-4.8h-4V44h-3V15Zm7 13.5h2.5c2.5 0 4-1.2 4-3.2s-1.5-3.2-4-3.2H32v6.4Zm0 13h3c2.8 0 4.5-1.2 4.5-3.5s-1.7-3.5-4.5-3.5h-3v7Z"
            fill="url(#footer-btc-grad)"
          />
          <defs>
            <linearGradient id="footer-btc-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f97316" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
        <FooterAnimated>
        {/* Top grid: mobile 2-col for link groups, desktop 12-col */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-10 lg:grid-cols-12 lg:gap-10">

          {/* Brand column — full width on mobile */}
          <div className="footer-block col-span-2 flex flex-col gap-4 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <Image
                  src="/images/logo_3.png"
                  alt="Pan-African Bitcoin Academy Logo"
                  width={48}
                  height={48}
                  className="object-contain brightness-110 contrast-125 saturate-120"
                  style={{ width: 'auto', height: 'auto' }}
                  quality={95}
                  sizes="48px"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Pan-African
                </span>
                <span className="text-sm font-medium text-zinc-100">₿itcoin Academy</span>
              </div>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-zinc-500">
              Empowering learners across Africa with sound Bitcoin education, one cohort at a time.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-1">
              <SocialIcon href="https://www.facebook.com/profile.php?id=61586743276906" label="Facebook">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </SocialIcon>
              <SocialIcon href="https://x.com/panafricanbtc" label="X / Twitter">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com/panafricanbitcoin/" label="Instagram">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/>
              </SocialIcon>
              <SocialIcon href="https://www.tiktok.com/@panafricanbitcoin" label="TikTok">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z"/>
              </SocialIcon>
              <SocialIcon href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji" label="WhatsApp">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </SocialIcon>
              <SocialIcon href="https://discord.gg/4G4TUAP7" label="Discord">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </SocialIcon>
              <SocialIcon href="https://github.com/Joie199/pan-africa-bitcoin-academy" label="GitHub">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </SocialIcon>
            </div>
          </div>

          {/* Learn column */}
          <div className="footer-block lg:col-span-2">
            <FooterHeading>Learn</FooterHeading>
            <ul className="space-y-1.5 text-xs sm:space-y-2">
              <FooterLink href="/chapters">Chapters</FooterLink>
              <FooterLink href="/white_paper">Bitcoin Whitepaper</FooterLink>
              <FooterLink href="/bitcoin-in-eritrea">Bitcoin in Eritrea</FooterLink>
              <FooterLink href="/scam">Scam Awareness</FooterLink>
              <FooterLink href="/developer-hub">Developer Hub</FooterLink>
              <FooterLink href="/exam">Final Exam</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
            </ul>
          </div>

          {/* Academy column */}
          <div className="footer-block lg:col-span-2">
            <FooterHeading>Academy</FooterHeading>
            <ul className="space-y-1.5 text-xs sm:space-y-2">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/impact">Impact</FooterLink>
              <FooterLink href="/mentorship">Join us on mentoring</FooterLink>
              <FooterLink href="/events">Events</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
            </ul>
          </div>

          {/* Get Involved column */}
          <div className="footer-block lg:col-span-2">
            <FooterHeading>Get Involved</FooterHeading>
            <ul className="space-y-1.5 text-xs sm:space-y-2">
              <FooterLink href="/apply">Apply Now</FooterLink>
              <FooterLink href="/donate">Donate</FooterLink>
              <FooterLink href="/sponsor">Sponsor</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/search">Search</FooterLink>
            </ul>
          </div>

          {/* Students column */}
          <div className="footer-block lg:col-span-2">
            <FooterHeading>Students</FooterHeading>
            <ul className="space-y-1.5 text-xs sm:space-y-2">
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/blog/submit">Write a Post</FooterLink>
              <FooterLink href="/chapters">Start Learning</FooterLink>
            </ul>
          </div>
        </div>
        </FooterAnimated>

        {/* Divider */}
        <div className="mt-6 mb-6 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent sm:my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Pan-African ₿itcoin Academy. Built by{" "}
            <a
              href="https://github.com/Joie199"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Joie
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Educational only &middot; Not financial advice</span>
            <span className="hidden sm:inline">&middot;</span>
            <a
              href="https://www.gnu.org/licenses/gpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              GPL-3.0 License
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="footer-heading group mb-2 sm:mb-3 cursor-default">
      <span className="footer-heading-text inline-block text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs bg-gradient-to-r from-orange-400 via-cyan-400 to-cyan-300 bg-clip-text text-transparent transition-transform duration-300 ease-out group-hover:scale-105 group-hover:tracking-[0.28em]">
        {children}
      </span>
      <span className="footer-heading-line mt-1.5 block h-0.5 w-8 rounded-full bg-gradient-to-r from-orange-400/80 to-cyan-400/80 transition-all duration-300 ease-out group-hover:w-12 group-hover:opacity-100" aria-hidden />
    </h4>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="block py-1 text-zinc-500 transition-colors hover:text-cyan-300 sm:py-0 sm:inline-block">
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500 transition-all hover:bg-cyan-500/15 hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]"
    >
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </a>
  );
}
