import { PageContainer } from "@/components/PageContainer";

export default function DonatePage() {
  return (
    <PageContainer
      title="Support Bitcoin Education"
      subtitle="Help us build Bitcoin sovereignty and education in Africa. Every sat counts."
    >
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
                {/* Lightning QR Code Placeholder */}
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-cyan-400/30 bg-zinc-900/50">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="mt-2 text-xs text-zinc-400">Lightning QR Code</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">LNURL</label>
                  <div className="rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-3 font-mono text-xs text-cyan-300 break-all">
                    lnurl1dp68gurn8ghj7um9wfmxjcm99e3k7mf0v9cxj0m385ekvcenxc6r2c35xvukzef0venky
                  </div>
                  <button className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110">
                    Copy LNURL
                  </button>
                </div>
              </div>
            </div>

            {/* On-Chain */}
            <div className="rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <h3 className="mb-4 text-lg font-semibold text-orange-200">On-Chain Address</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Bitcoin Address</label>
                  <div className="rounded-lg border border-orange-500/20 bg-zinc-900/50 p-3 font-mono text-xs text-orange-300 break-all">
                    bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                  </div>
                  <button className="w-full rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110">
                    Copy Address
                  </button>
                </div>
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                  <p className="text-xs text-zinc-400">
                    <span className="font-semibold text-orange-300">Note:</span> On-chain transactions may take longer to confirm and have higher fees. Lightning is recommended for smaller donations.
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
              <span><strong className="text-purple-200">Student Rewards:</strong> 60% of donations go directly to student sats rewards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">✓</span>
              <span><strong className="text-purple-200">Infrastructure:</strong> 25% for tools, hosting, and educational resources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">✓</span>
              <span><strong className="text-purple-200">Growth:</strong> 15% for expanding to new regions and communities</span>
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
              Questions? Contact us at <a href="mailto:support@bitcoinacademy.africa" className="text-cyan-300 hover:text-cyan-200">support@bitcoinacademy.africa</a>
            </p>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

