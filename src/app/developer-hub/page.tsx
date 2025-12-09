'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Code, GitBranch, Users, Calendar, Award, BookOpen, Rocket, HelpCircle, Github, Mail, MessageCircle } from 'lucide-react';

interface DeveloperResource {
  id: string;
  name: string;
  link: string;
  category: string;
  difficulty: string;
  recommendedBy?: string;
}

interface DeveloperEvent {
  id: string;
  name: string;
  date: string;
  type: string;
  guestName?: string;
  recordingLink?: string;
}

export default function DeveloperHubPage() {
  const [resources, setResources] = useState<DeveloperResource[]>([]);
  const [events, setEvents] = useState<DeveloperEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch resources and events from Notion (when APIs are ready)
    // For now, using placeholder data
    setResources([
      {
        id: '1',
        name: 'Bitcoin Core Developer Handbook',
        link: 'https://bitcoin.org/en/developer-documentation',
        category: 'Bitcoin Core',
        difficulty: 'Intermediate',
        recommendedBy: 'Chaincode Labs',
      },
    ]);
    setEvents([]);
    setLoading(false);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black/95">
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 p-4">
                <Code className="h-16 w-16 text-orange-400" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl">
              Developer Hub
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
              Your roadmap to becoming a Bitcoin developer. Connect, learn, and contribute to the global Bitcoin ecosystem.
            </p>
          </div>

          {/* SECTION 1 — Developer Path Overview */}
          <section className="mb-20 rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <Rocket className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Developer Path Overview</h2>
            </div>
            <div className="space-y-4 text-zinc-300">
              <p className="text-lg text-zinc-100">
                <strong className="text-orange-400">You don't need to be an expert.</strong> If you know basic programming and want to join the global Bitcoin developer community, this page shows you the path.
              </p>
              
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 font-semibold text-cyan-300">What Bitcoin Developers Do</h3>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    <li>• Build wallets & LN apps</li>
                    <li>• Contribute to Bitcoin Core</li>
                    <li>• Write documentation</li>
                    <li>• Review pull requests</li>
                    <li>• Improve security & privacy</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 font-semibold text-orange-300">Skills Required</h3>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    <li>• Basic programming</li>
                    <li>• Git version control</li>
                    <li>• Linux command line</li>
                    <li>• Problem-solving mindset</li>
                    <li>• Willingness to learn</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 font-semibold text-purple-300">What You Can Contribute</h3>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    <li>• Wallet development</li>
                    <li>• Lightning Network apps</li>
                    <li>• Documentation & guides</li>
                    <li>• Code reviews & testing</li>
                    <li>• Bug fixes & improvements</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 — Beginner Developer Starter Guide */}
          <section className="mb-20 rounded-xl border border-orange-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/20 p-2">
                <BookOpen className="h-6 w-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Beginner Developer Starter Guide</h2>
            </div>

            <div className="space-y-8">
              {/* 1. Bitcoin Intro */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-orange-300">1. Bitcoin Intro (For Developers)</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://bitcoin.org/en/developer-documentation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Core Developer Handbook</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://base58.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Base58 Courses</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://learning.chaincode.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Chaincode Labs Intro Videos</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://github.com/chaincodelabs/learning-bitcoin-from-the-command-line"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Learning Bitcoin from Command Line</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://murch.one/education"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Murch's Masters Level Education</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                </div>
              </div>

              {/* 2. Learn the Tools */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-cyan-300">2. Learn the Tools</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://sparrowwallet.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Sparrow Wallet</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://bitcoincore.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Core</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://electrum.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Electrum</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://mempool.space"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">mempool.space</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://github.com/rust-bitcoin/rust-bitcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Rust-Bitcoin</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://bitcoin.org/en/developer-glossary"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Developer Glossary</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                </div>
              </div>

              {/* 3. Developer Roadmap */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-purple-300">3. Developer Roadmap</h3>
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-6">
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <div className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 font-semibold text-black">
                      Start
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300">
                      Learn Basics
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300">
                      Bitcoin Internals
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300">
                      Explore Scripting
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300">
                      Learn Wallet Building
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300">
                      Lightning Basics
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-cyan-300">
                      Join OSS
                    </div>
                    <span className="text-purple-300">→</span>
                    <div className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 font-semibold text-black">
                      First Contribution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 — Global Bitcoin Developer Communities */}
          <section className="mb-20 rounded-xl border border-purple-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Global Bitcoin Developer Communities</h2>
            </div>

            <div className="space-y-6">
              {/* Bitcoin Core Community */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-6">
                <h3 className="mb-4 text-xl font-semibold text-orange-300">Bitcoin Core Community</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://github.com/bitcoin/bitcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 transition hover:border-orange-500/50"
                  >
                    <Github className="h-5 w-5 text-zinc-400" />
                    <span className="text-zinc-300">Bitcoin Core GitHub</span>
                  </a>
                  <a
                    href="https://lists.linuxfoundation.org/mailman/listinfo/bitcoin-dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 transition hover:border-orange-500/50"
                  >
                    <Mail className="h-5 w-5 text-zinc-400" />
                    <span className="text-zinc-300">Mailing List</span>
                  </a>
                  <a
                    href="https://bitcoin.org/en/developer-documentation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 transition hover:border-orange-500/50"
                  >
                    <BookOpen className="h-5 w-5 text-zinc-400" />
                    <span className="text-zinc-300">BIPs & Documentation</span>
                  </a>
                  <a
                    href="https://github.com/bitcoin/bitcoin/blob/master/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 transition hover:border-orange-500/50"
                  >
                    <GitBranch className="h-5 w-5 text-zinc-400" />
                    <span className="text-zinc-300">Testing/Review Guide</span>
                  </a>
                </div>
              </div>

              {/* Other Communities */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-cyan-300">Chaincode Labs</h4>
                  <a
                    href="https://learning.chaincode.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-cyan-300"
                  >
                    Bitcoin Protocol Development Learning Guide →
                  </a>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-orange-300">Summer of Bitcoin</h4>
                  <a
                    href="https://www.summerofbitcoin.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-orange-300"
                  >
                    Application Portal & Curriculum →
                  </a>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-purple-300">Base58 Bitcoin School</h4>
                  <div className="space-y-2 text-sm text-zinc-400">
                    <a href="https://base58.info" target="_blank" rel="noopener noreferrer" className="block hover:text-purple-300">
                      Intro to UTXOs →
                    </a>
                    <a href="https://github.com/richardkiss/pycoin" target="_blank" rel="noopener noreferrer" className="block hover:text-purple-300">
                      Pycoin →
                    </a>
                    <a href="https://base58.info/bitcoin-script" target="_blank" rel="noopener noreferrer" className="block hover:text-purple-300">
                      Bitcoin Script →
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-green-300">Bitcoin Dev Telegram</h4>
                  <div className="space-y-1 text-sm text-zinc-400">
                    <div>• Africa Bitcoin Dev</div>
                    <div>• Global Bitcoin Dev</div>
                    <div>• Rust-Bitcoin</div>
                    <div>• Libsecp256k1</div>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-cyan-300">Spiral (Block)</h4>
                  <div className="space-y-2 text-sm text-zinc-400">
                    <a href="https://spiral.xyz" target="_blank" rel="noopener noreferrer" className="block hover:text-cyan-300">
                      Grants Program →
                    </a>
                    <a href="https://spiral.xyz/developers" target="_blank" rel="noopener noreferrer" className="block hover:text-cyan-300">
                      OSS Developers →
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-orange-300">Bolt.fun</h4>
                  <div className="space-y-2 text-sm text-zinc-400">
                    <a href="https://bolt.fun" target="_blank" rel="noopener noreferrer" className="block hover:text-orange-300">
                      Hackathons →
                    </a>
                    <a href="https://bolt.fun/community" target="_blank" rel="noopener noreferrer" className="block hover:text-orange-300">
                      Developer Community →
                    </a>
                    <a href="https://bolt.fun/projects" target="_blank" rel="noopener noreferrer" className="block hover:text-orange-300">
                      LN Projects →
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-purple-300">Bitcoin++ Events</h4>
                  <a
                    href="https://bitcoinplusplus.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-purple-300"
                  >
                    Developer-Focused Conferences →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4 — Mentors & Guest Developers */}
          <section className="mb-20 rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Mentors & Guest Developers</h2>
            </div>
            <p className="mb-6 text-zinc-400">
              Connect with experienced Bitcoin developers who are willing to assist, share knowledge, and guide your journey.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Placeholder for mentor cards - will be populated from Notion */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-cyan-500"></div>
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">Mentor Name</h3>
                <p className="mb-2 text-sm text-zinc-400">Company/Project</p>
                <p className="mb-4 text-xs text-zinc-500">Lightning Network Developer</p>
                <button className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/30">
                  Book a Session
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 5 — Developer Meetings, Workshops & Meetups */}
          <section className="mb-20 rounded-xl border border-orange-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/20 p-2">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Developer Meetings, Workshops & Meetups</h2>
            </div>
            <div className="space-y-4">
              {/* Events will be populated from Notion Events DB */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-100">Lightning Builder Hangout</h3>
                  <span className="text-sm text-zinc-400">Feb 16, 2025</span>
                </div>
                <p className="text-sm text-zinc-400">Monthly online Q&A session for Lightning developers</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-100">Bitcoin Dev Kampala Meetup</h3>
                  <span className="text-sm text-zinc-400">March 3, 2025</span>
                </div>
                <p className="text-sm text-zinc-400">Local meetup for Bitcoin developers in Uganda</p>
              </div>
            </div>
          </section>

          {/* SECTION 6 — Developer Opportunities for Africans */}
          <section className="mb-20 rounded-xl border border-green-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <Award className="h-6 w-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Developer Opportunities for Africans</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Summer of Bitcoin', desc: 'Top programme for student internships', link: 'https://www.summerofbitcoin.org' },
                { name: 'Spiral Grants', desc: 'Funding for Bitcoin OSS work', link: 'https://spiral.xyz' },
                { name: 'Fedi Grants', desc: 'Funding opportunities', link: 'https://fedi.xyz' },
                { name: 'Built with Bitcoin', desc: 'Internship programs', link: 'https://builtwithbitcoin.org' },
                { name: 'Bolt.Fun Bounties', desc: 'Hackathon bounties', link: 'https://bolt.fun' },
                { name: 'AfroBitcoinHack', desc: 'Africa-focused hackathons', link: '#' },
                { name: 'Africa Bitcoin Conference', desc: 'Developer tracks', link: '#' },
                { name: 'Geyser Grants', desc: 'Bitcoin project funding', link: 'https://geyser.fund' },
                { name: 'BitDevs Events', desc: 'Local developer meetups', link: 'https://bitdevs.org' },
              ].map((opp, idx) => (
                <a
                  key={idx}
                  href={opp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-green-500/50 hover:bg-zinc-900"
                >
                  <h4 className="mb-2 font-semibold text-green-300">{opp.name}</h4>
                  <p className="text-sm text-zinc-400">{opp.desc}</p>
                </a>
              ))}
            </div>
          </section>

          {/* SECTION 7 — Build Your First Portfolio Project */}
          <section className="mb-20 rounded-xl border border-purple-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2">
                <Rocket className="h-6 w-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Build Your First Portfolio Project</h2>
            </div>
            <p className="mb-6 text-zinc-400">
              Get started with these project ideas. We provide guidance and resources, not step-by-step tutorials.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                'Simple Bitcoin Wallet',
                'Lightning Invoice Generator',
                'Seed Phrase Backup Tool',
                'Bitcoin Address Parser',
                'Blockchain Analyzer',
                'UTXO Visualizer',
                'Mempool Monitor',
                'PSBT Builder',
              ].map((project, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-purple-500/50"
                >
                  <h4 className="font-semibold text-purple-300">{project}</h4>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 8 — Certification Path */}
          <section className="mb-20 rounded-xl border border-yellow-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <Award className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Certification Path (Optional)</h2>
            </div>
            <p className="mb-6 text-zinc-400">
              Earn a certificate by demonstrating your involvement in the Bitcoin developer community.
            </p>
            <div className="space-y-3">
              {[
                'Follow the starter guide',
                'Attend 2–3 dev sessions',
                'Build a small tool or write an article',
                'Participate in a review session',
              ].map((req, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                    ✓
                  </div>
                  <span className="text-zinc-300">{req}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 9 — Developer FAQs */}
          <section className="mb-20 rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <HelpCircle className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Developer FAQs</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: 'Do I need to know C++ to contribute?',
                  a: 'No! Bitcoin Core uses C++, but many projects use Python, Rust, JavaScript, and other languages. Start with what you know.',
                },
                {
                  q: 'Can I start with Python?',
                  a: 'Absolutely! Many Bitcoin tools and libraries are written in Python. Check out pycoin and python-bitcoinlib.',
                },
                {
                  q: 'How long does it take?',
                  a: 'There\'s no fixed timeline. Focus on learning fundamentals, then start contributing to small issues. Every contribution matters.',
                },
                {
                  q: 'Is Bitcoin Core only for experts?',
                  a: 'Not at all! Start with documentation, testing, or small bug fixes. The community is welcoming to newcomers.',
                },
                {
                  q: 'How do I find a mentor?',
                  a: 'Join developer communities, attend meetups, and don\'t hesitate to ask questions. Many developers are happy to help.',
                },
                {
                  q: 'Where do I ask questions?',
                  a: 'Use Bitcoin Stack Exchange, developer mailing lists, Telegram groups, or IRC channels. Be respectful and do your research first.',
                },
              ].map((faq, idx) => (
                <details key={idx} className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <summary className="cursor-pointer font-semibold text-cyan-300">{faq.q}</summary>
                  <p className="mt-2 text-zinc-400">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="rounded-xl border border-orange-400/25 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 p-8 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Ready to Start Your Developer Journey?</h2>
            <p className="mb-6 text-zinc-400">
              Join our community and connect with other Bitcoin developers in Africa.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-base font-semibold text-white transition hover:brightness-110"
              >
                Join Developer Community
              </a>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-lg border border-orange-400/30 bg-orange-400/10 px-8 py-4 text-base font-semibold text-orange-300 transition hover:bg-orange-400/20"
              >
                Apply to Academy
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

