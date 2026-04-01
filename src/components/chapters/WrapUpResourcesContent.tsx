import { WRAP_UP_GLOSSARY } from "@/content/wrapUpGlossary";

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 14h.01" />
    </svg>
  );
}
function IconKey({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 2l-1 1m-2 2l-7 7M9 18l-2 2H5v-2l8-8 3 3-8 8z" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}
function IconArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

type LinkRowProps = {
  name: string;
  href: string;
  note?: string;
  /** Primary link label (default &quot;Website&quot;) */
  websiteLabel?: string;
  iosHref?: string;
  androidHref?: string;
  /** Desktop installer, web client, or other non-store download */
  downloadHref?: string;
  downloadLabel?: string;
};

function LinkRow({
  name,
  href,
  note,
  websiteLabel = "Website",
  iosHref,
  androidHref,
  downloadHref,
  downloadLabel,
}: LinkRowProps) {
  const extraLabel = downloadLabel ?? "Download";
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="font-semibold text-zinc-100">{name}</span>
          {note ? <p className="mt-0.5 text-xs text-zinc-500">{note}</p> : null}
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            {websiteLabel}
          </a>
          {iosHref ? (
            <a
              href={iosHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-violet-500/35 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
            >
              App Store
            </a>
          ) : null}
          {androidHref ? (
            <a
              href={androidHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
              Google Play
            </a>
          ) : null}
          {downloadHref ? (
            <a
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-200 hover:bg-orange-500/20"
            >
              {extraLabel}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const ACTION_ITEMS = [
  { text: "Install a wallet (non-custodial)", Icon: IconWallet },
  { text: "Back up seed phrase (offline)", Icon: IconKey },
  { text: "Receive a small amount", Icon: IconArrowDown },
  { text: "Send a small transaction", Icon: IconArrowUp },
  { text: "Try a Lightning payment", Icon: IconBolt },
] as const;

const SAFETY_ITEMS = [
  "Never share seed phrase",
  "Always verify addresses",
  "Use test amounts first",
  "Avoid unknown apps/websites",
  "Keep backups in separate locations",
] as const;

export function WrapUpResourcesContent() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Intro */}
      <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-orange-950/30 p-5 sm:p-8 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
        <p className="text-sm font-medium uppercase tracking-wider text-cyan-400/90">Course wrap-up</p>
        <h2 className="mt-2 text-xl font-bold text-zinc-50 sm:text-2xl lg:text-3xl">
          Now that you have learned about Bitcoin, what&apos;s next?
        </h2>
        <blockquote className="mt-6 border-l-4 border-orange-400/70 bg-orange-500/5 py-4 pl-4 pr-3 sm:mt-8 sm:py-5 sm:pl-6">
          <p className="text-lg font-serif italic leading-snug text-orange-50 sm:text-2xl sm:leading-snug lg:text-3xl">
            &ldquo;Bitcoin gives you full control—but also full responsibility.&rdquo;
          </p>
        </blockquote>
      </section>

      {/* Action + Safety */}
      <section className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 sm:p-6">
          <h3 className="text-lg font-bold text-cyan-200 sm:text-xl">What You Can Do Now (Action Layer)</h3>
          <ul className="mt-4 space-y-3">
            {ACTION_ITEMS.map(({ text, Icon }) => (
              <li key={text} className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-3 py-3 sm:px-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-1.5 text-sm font-medium text-zinc-200 sm:text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <IconShield className="h-6 w-6 text-amber-400" />
            <h3 className="text-lg font-bold text-amber-200 sm:text-xl">Safety Checklist</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {SAFETY_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-50/95"
              >
                <span className="mt-0.5 text-amber-400">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Wallets */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 sm:p-8">
        <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">Wallets (No KYC — you control keys)</h3>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Non-custodial options so you hold your keys. On phone, use App Store / Google Play; on desktop, use Website and the
          desktop download link. Verify URLs match the official domain; start with small amounts.
        </p>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-950/40 via-zinc-950/50 to-cyan-950/20 p-4 shadow-[0_0_24px_rgba(45,212,191,0.06)] sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.7)]" aria-hidden />
              <h4 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Offline supporting wallets</h4>
            </div>
            <p className="text-xs leading-relaxed text-teal-100/55 sm:text-sm">
              Options that can work with limited connectivity or community setups—understand the custody model before using.
            </p>
            <div className="mt-4 space-y-2 rounded-lg border border-teal-500/15 bg-black/25 p-3 sm:p-4">
              <LinkRow
                name="Fedi"
                note="Fedimint-based community app—federated custody model (different trade-offs vs self-custody singlesig). Read how it works before using."
                href="https://www.fedi.xyz"
                iosHref="https://apps.apple.com/us/app/fedi/id6448916281"
                androidHref="https://play.google.com/store/apps/details?id=com.fedi"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">Mobile (beginner-friendly)</h4>
            <div className="mt-3 space-y-2">
              <LinkRow
                name="Phoenix"
                note="Simple non-custodial Lightning wallet."
                href="https://phoenix.acinq.co"
                iosHref="https://apps.apple.com/us/app/phoenix-wallet/id1544097028"
                androidHref="https://play.google.com/store/apps/details?id=fr.acinq.phoenix.mainnet"
              />
              <LinkRow
                name="Breez"
                note="Lightning + POS-style features."
                href="https://breez.technology"
                iosHref="https://apps.apple.com/us/app/breez-lightning-client-pos/id1463604142"
                androidHref="https://play.google.com/store/apps/details?id=com.breez.client"
              />
              <LinkRow
                name="Muun"
                note="Hybrid on-chain + Lightning; easy UX."
                href="https://muun.com"
                iosHref="https://apps.apple.com/us/app/muun-wallet/id1482037683"
                androidHref="https://play.google.com/store/apps/details?id=io.muun.apollo"
              />
              <LinkRow
                name="BlueWallet"
                note="Good starter: on-chain + optional Lightning."
                href="https://bluewallet.io"
                iosHref="https://apps.apple.com/us/app/bluewallet-bitcoin-wallet/id1376878040"
                androidHref="https://play.google.com/store/apps/details?id=io.bluewallet.bluewallet"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-orange-400">Desktop (more control)</h4>
            <div className="mt-3 space-y-2">
              <LinkRow
                name="Sparrow"
                note="Strong for learning UTXOs and coin control."
                href="https://sparrowwallet.com"
                downloadHref="https://sparrowwallet.com/download/"
                downloadLabel="Desktop download"
              />
              <LinkRow
                name="Electrum"
                note="Lightweight; advanced options."
                href="https://electrum.org"
                downloadHref="https://electrum.org/#download"
                downloadLabel="Desktop download"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-purple-400">Hardware (best security)</h4>
            <div className="mt-3 space-y-2">
              <LinkRow
                name="Coldcard"
                note="Bitcoin-only; very security-focused."
                href="https://coldcard.com"
                downloadHref="https://coldcard.com/docs/"
                downloadLabel="Docs & shop"
              />
              <LinkRow
                name="Trezor"
                note="Popular; relatively approachable setup."
                href="https://trezor.io"
                iosHref="https://apps.apple.com/us/app/trezor-suite-lite/id1631884497"
                androidHref="https://play.google.com/store/apps/details?id=io.trezor.suite"
                downloadHref="https://trezor.io/trezor-suite"
                downloadLabel="Trezor Suite (desktop)"
              />
              <LinkRow
                name="Ledger"
                note="Widely used; supports many assets (not Bitcoin-only)."
                href="https://www.ledger.com"
                iosHref="https://apps.apple.com/us/app/ledger-live-crypto-wallet/id1361671700"
                androidHref="https://play.google.com/store/apps/details?id=com.ledger.live"
              />
              <LinkRow
                name="Blockstream Jade"
                note="Open-source Bitcoin hardware wallet; often used with Blockstream Green."
                href="https://blockstream.com/jade/"
              />
            </div>
          </div>
        </div>
      </section>

      {/* P2P */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 sm:p-8">
        <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">Getting Bitcoin (without traditional KYC)</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Peer-to-peer routes reduce central custody and can improve privacy. They require more care: reputation, escrow, and
          clear process.
        </p>
        <h4 className="mt-6 text-sm font-semibold text-cyan-300">1. Peer-to-Peer (P2P)</h4>
        <div className="mt-3 space-y-2">
          <LinkRow
            name="Bisq"
            note="Decentralized desktop P2P; no KYC by design."
            href="https://bisq.network"
            downloadHref="https://bisq.network/downloads/"
            downloadLabel="Desktop download"
          />
          <LinkRow
            name="RoboSats"
            note="Simple P2P with Lightning (often used via Tor / web client)."
            href="https://robosats.org"
            downloadHref="https://unsafe.robosats.org"
            downloadLabel="Web client"
          />
          <LinkRow name="Hodl Hodl" note="P2P with multisig escrow." href="https://hodlhodl.com" />
        </div>
        <ul className="mt-4 space-y-1 text-sm text-zinc-300">
          <li>
            <span className="text-emerald-400">✔</span> No central custody of funds during the trade (protocol-dependent)
          </li>
          <li>
            <span className="text-emerald-400">✔</span> Often more private than centralized exchanges
          </li>
          <li>
            <span className="text-amber-400">✖</span> Requires care: escrow flow, counterparty reputation, and local legal context
          </li>
        </ul>
      </section>

      {/* African-focused */}
      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5 sm:p-8">
        <h3 className="text-lg font-bold text-emerald-200 sm:text-xl">African-focused Bitcoin access</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Tools shaped for connectivity, feature phones, and community usage—always verify the latest product pages before
          installing.
        </p>
        <div className="mt-5 space-y-3">
          <LinkRow
            name="Machankura (USSD)"
            note="No smartphone required; USSD access in supported regions."
            href="https://8333.mobi"
            websiteLabel="8333.mobi"
          />
          <LinkRow
            name="Gorilla Sats OTC"
            note="Uganda-focused OTC and bitcoin access."
            href="https://otc.gorilla-sats.com/"
          />
          <LinkRow
            name="Tando"
            note="Kenya-based; spend Lightning bitcoin in everyday contexts where supported."
            href="https://www.tando.me"
            iosHref="https://apps.apple.com/us/app/tando/id6584531359"
            androidHref="https://play.google.com/store/apps/details?id=me.tando.tandoapp"
            downloadHref="https://tando.me/download/"
            downloadLabel="Download hub"
          />
        </div>
      </section>

      {/* Glossary */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/90 p-5 sm:p-8" id="wrap-up-glossary">
        <h3 className="text-xl font-bold text-zinc-50 sm:text-2xl">Glossary</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Quick definitions for terms used across the course. Scroll the page like other chapters; terms are highlighted.
        </p>
        <div className="mt-6 space-y-1 rounded-xl border border-zinc-800/60 bg-black/30 p-4 sm:p-5">
          {WRAP_UP_GLOSSARY.map(({ term, definition }) => (
            <p
              key={term}
              className="border-b border-zinc-800/40 py-1.5 text-sm leading-snug text-zinc-300 last:border-b-0 sm:py-1"
            >
              <span className="font-semibold text-cyan-300">{term}</span>
              <span className="text-zinc-600"> — </span>
              <span>{definition}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
