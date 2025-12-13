'use client';

const ONCHAIN_ADDRESS = 'bc1q4pg073ws86qdnxac3y8zhk4t8vtkg2vx529jrj';
const ONCHAIN_QR_SRC = '/images/onchain-btc-qr.jpeg'; // Using provided JPEG QR image
const LIGHTNING_ADDRESS = 'panafricanbitcoin@blink.sv';
const LNURL_QR_SRC = '/images/lunrl_qr.jpeg'; // Lightning QR code image

export default function DonatePage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Support Bitcoin Education
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
              Help us build Bitcoin sovereignty and education in Africa. Every sat counts.
            </p>
          </div>

      <div className="space-y-12">
        {/* Why Donations Matter */}
        <section className="space-y-4 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <h2 className="text-xl font-semibold text-orange-200">Why Donations Matter</h2>
          <p className="text-sm text-zinc-300 sm:text-base">
            Many Bitcoin projects survive on donations. Your support helps us:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300 sm:text-base">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Provide free, high-quality Bitcoin education to students across Africa</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Reward students with sats for completing assignments and projects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Maintain infrastructure and tools for teaching</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Expand our reach to more countries and communities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Support mentors and guest lecturers</span>
            </li>
          </ul>
        </section>

        {/* Payment Methods */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Bitcoin-Only Support</h2>
          <p className="text-sm text-zinc-400">
            We accept Bitcoin payments via Lightning Network and on-chain. Choose your preferred method:
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Lightning Network */}
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <h3 className="mb-4 text-lg font-semibold text-cyan-200">Lightning Network</h3>
              <div className="space-y-4">
                {/* Lightning QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl border border-cyan-400/30 bg-zinc-900/60 p-3">
                    <img
                      src={LNURL_QR_SRC}
                      alt="Lightning Network donation QR code"
                      className="h-48 w-48 rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-xs text-zinc-400">Scan to donate via Lightning</p>
                </div>
                
                {/* Paycode section */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 text-center block">Paycode</label>
                  <div className="rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-3 font-mono text-xs text-cyan-300 break-all text-center">
                    {LIGHTNING_ADDRESS}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard?.writeText(LIGHTNING_ADDRESS)}
                    className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Copy Paycode
                  </button>
                </div>
              </div>
            </div>

            {/* On-Chain */}
            <div className="rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <h3 className="mb-4 text-lg font-semibold text-orange-200">On-Chain Address</h3>
              <div className="space-y-4">
                {/* QR Image */}
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl border border-orange-500/30 bg-zinc-900/60 p-3">
                    <img
                      src={ONCHAIN_QR_SRC}
                      alt="On-chain Bitcoin donation QR"
                      className="h-48 w-48 rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-xs text-zinc-400">Scan to donate on-chain</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 text-center block">Bitcoin Address</label>
                  <div className="rounded-lg border border-orange-500/20 bg-zinc-900/50 p-3 font-mono text-xs text-orange-300 break-all text-center">
                    {ONCHAIN_ADDRESS}
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(ONCHAIN_ADDRESS)}
                    className="w-full rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Copy Address
                  </button>
                </div>
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                  <p className="text-xs text-zinc-400">
                    <span className="font-semibold text-orange-300">Note:</span> On-chain transactions may take longer to confirm and have higher fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Plan */}
        <section className="space-y-4 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          <h2 className="text-xl font-semibold text-purple-200">Transparency Plan</h2>
          <p className="text-sm text-zinc-300 sm:text-base">
            We believe in transparency and accountability. Here's how we handle donations:
          </p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300 sm:text-base">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">✓</span>
              <span><strong className="text-purple-200">Public Reporting:</strong> Monthly reports on how donations are used</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">✓</span>
              <span><strong className="text-purple-200">Student Rewards:</strong> 50% of donations go directly to student sats rewards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">✓</span>
              <span><strong className="text-purple-200">Infrastructure:</strong> 25% for tools, hosting, and educational resources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">✓</span>
              <span><strong className="text-purple-200">Growth:</strong> 10% for expanding to new regions and communities</span>
            </li>
          </ul>
          <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
            <p className="text-xs text-zinc-400">
              View our <a href="/impact" className="font-semibold text-purple-300 hover:text-purple-200">Impact Dashboard</a> for real-time metrics and detailed reports.
            </p>
          </div>
        </section>

        {/* Thank You */}
        <section className="text-center">
          <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <h2 className="text-2xl font-semibold text-cyan-200">Thank You</h2>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Your support helps build Bitcoin sovereignty and education in Africa. Every contribution, no matter how small, makes a difference.
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Questions? Contact us at <a href="mailto:support@panafricanbitcoin.com" className="text-cyan-300 hover:text-cyan-200">support@panafricanbitcoin.com</a>
            </p>
          </div>
        </section>
      </div>
        </div>
      </div>
    </div>
  );
}


        </section>
      </div>
        </div>
      </div>
    </div>
  );
}

