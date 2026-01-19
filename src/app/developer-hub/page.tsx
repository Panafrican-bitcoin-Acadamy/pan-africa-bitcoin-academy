'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Code, GitBranch, Users, Calendar, Award, BookOpen, Rocket, HelpCircle, Github, Mail, Zap, Database, TrendingUp, FlaskConical } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { AnimatedList } from '@/components/AnimatedList';

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
  const [mentors, setMentors] = useState<any[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  useEffect(() => {
    // TODO: Fetch resources and events from Supabase
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

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('/api/mentors');
        if (response.ok) {
          const data = await response.json();
          setMentors(data.mentors || []);
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentors();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black/95">
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
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
          </AnimatedSection>

          {/* SECTION 1 — Developer Path Overview */}
          <AnimatedSection animation="slideLeft">
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
          </AnimatedSection>

          {/* SECTION 2 — Beginner Developer Starter Guide */}
          <AnimatedSection animation="slideRight">
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
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Bitcoin Core */}
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-5 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-orange-200">Bitcoin Core</h4>
                      <a
                        href="https://bitcoincore.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-300 hover:text-orange-200"
                        aria-label="Visit Bitcoin Core website (opens in new tab)"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">The fundamental tool for any Bitcoin developer.</p>
                    <p className="mb-3 text-sm font-medium text-orange-200">Why use it?</p>
                    <ul className="ml-4 space-y-1 text-sm text-zinc-400">
                      <li>• Lets students run a full node</li>
                      <li>• Explore blockchain data</li>
                      <li>• Practice RPC commands</li>
                      <li>• Learn how transactions & blocks work under the hood</li>
                    </ul>
                  </div>

                  {/* Sparrow Wallet */}
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-5 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-cyan-200">Sparrow Wallet</h4>
                      <a
                        href="https://sparrowwallet.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:text-cyan-200"
                        aria-label="Visit Sparrow Wallet website (opens in new tab)"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">One of the best educational tools for understanding UTXOs, signing, and PSBTs.</p>
                    <p className="mb-3 text-sm font-medium text-cyan-200">Why use it?</p>
                    <ul className="ml-4 space-y-1 text-sm text-zinc-400">
                      <li>• Shows UTXOs visually</li>
                      <li>• Easy way to build, sign, and broadcast transactions</li>
                      <li>• Teaches inputs, outputs, fees, script types</li>
                      <li>• Supports testnet and signet</li>
                    </ul>
                  </div>

                  {/* Bitcoin CLI / RPC Commands */}
                  <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-5 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-purple-200">Bitcoin CLI / RPC Commands</h4>
                      <a
                        href="https://bitcoin.org/en/developer-reference#rpc-quick-reference"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-200"
                        aria-label="View Bitcoin CLI RPC Commands documentation (opens in new tab)"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">This is what Bitcoin Core developers use daily.</p>
                    <p className="mb-3 text-sm font-medium text-purple-200">Why use it?</p>
                    <ul className="ml-4 space-y-1 text-sm text-zinc-400">
                      <li>• Direct interaction with the node</li>
                      <li>• Teaches JSON-RPC</li>
                      <li>• Builds foundation for wallet programming</li>
                    </ul>
                  </div>

                  {/* SavingsSatoshi */}
                  <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-5 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-indigo-200">SavingsSatoshi</h4>
                      <a
                        href="https://savingsatoshi.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:text-indigo-200"
                        aria-label="Visit SavingsSatoshi website (opens in new tab)"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">Code your way through the mysteries of bitcoin.</p>
                    <p className="mb-3 text-sm font-medium text-indigo-200">Why use it?</p>
                    <ul className="ml-4 space-y-1 text-sm text-zinc-400">
                      <li>• Interactive coding challenges</li>
                      <li>• Learn Bitcoin concepts through practice</li>
                      <li>• Open-source production by the Bitcoin community</li>
                      <li>• Build practical Bitcoin development skills</li>
                    </ul>
                  </div>

                  {/* Mempool Explorers & Block Explorers */}
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-green-200">Mempool Explorers & Block Explorers</h4>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">Tools that help beginners see Bitcoin in action.</p>
                    <p className="mb-3 text-sm font-medium text-green-200">Best Ones:</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <a
                        href="https://mempool.space"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>mempool.space</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://explorer.btc.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>explorer.btc.com</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://blockstream.info"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Signet Explorer</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>

                  {/* Signet & Testnet */}
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-yellow-200">Signet & Testnet</h4>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">Every developer must learn to use Bitcoin's testing chains.</p>
                    <p className="mb-3 text-sm font-medium text-yellow-200">Why?</p>
                    <ul className="ml-4 space-y-1 text-sm text-zinc-400">
                      <li>• Safe environment</li>
                      <li>• No real money</li>
                      <li>• Instant transactions</li>
                    </ul>
                  </div>

                  {/* Lightning Tools */}
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-5 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-blue-200">Lightning Tools</h4>
                    </div>
                    <p className="mb-3 text-sm text-zinc-300">Let beginners see what Lightning development looks like.</p>
                    <p className="mb-3 text-sm font-medium text-blue-200">Tools:</p>
                    <div className="space-y-2">
                      <a
                        href="https://github.com/lightningnetwork/lnd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-blue-500/50"
                      >
                        <span>LND</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://github.com/ElementsProject/lightning"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-blue-500/50"
                      >
                        <span>Core Lightning</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://lnbits.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-blue-500/50"
                      >
                        <span>LNbits</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://getalby.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-blue-500/50"
                      >
                        <span>Alby</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>

                  {/* Additional Resources */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-5 flex flex-col h-full">
                    <h4 className="mb-3 text-lg font-semibold text-zinc-200">Additional Resources</h4>
                    <div className="space-y-2">
                      <a
                        href="https://electrum.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-cyan-500/50"
                      >
                        <span>Electrum</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://github.com/rust-bitcoin/rust-bitcoin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-cyan-500/50"
                      >
                        <span>Rust-Bitcoin</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://bitcoin.org/en/developer-glossary"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-cyan-500/50"
                      >
                        <span>Bitcoin Developer Glossary</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>
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
          </AnimatedSection>

          {/* SECTION 3 — Global Bitcoin Developer Communities */}
          <AnimatedSection animation="slideLeft">
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
              <div>
                <h3 className="mb-4 text-xl font-semibold text-purple-300">Other Communities</h3>
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

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 font-semibold text-yellow-300">Bitrust</h4>
                  <a
                    href="https://bitrust.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-yellow-300"
                  >
                    Bitcoin Developer Community →
                  </a>
                </div>
              </div>
            </div>
            </div>
          </section>
          </AnimatedSection>

          {/* SECTION 4 — Bitcoin Mining Resources */}
          <AnimatedSection animation="slideRight">
            <section className="mb-20 rounded-xl border border-orange-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/20 p-2">
                <Zap className="h-6 w-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Bitcoin Mining Resources</h2>
            </div>
            <p className="mb-6 text-zinc-400">
              Comprehensive resources, tools, and communities for students to study and research Bitcoin mining. Learn about mining technology, energy trends, practical experiments, and industry developments.
            </p>

            <div className="space-y-8">
              {/* 1. Educational Resources & About Sites */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-orange-300">Educational Resources & About Sites</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://bitcoin.org/en/how-it-works"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin.org - How It Works</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://learnmeabitcoin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Learn Me A Bitcoin</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://bitcoinmagazine.com/guides/what-is-bitcoin-mining"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Magazine - Mining Guide</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://www.coindesk.com/learn/what-is-bitcoin-mining"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">CoinDesk - Mining Explained</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://bitcoin.org/en/developer-guide#mining"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-orange-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Developer Guide - Mining</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  </div>
                  </div>

              {/* 2. Environmental & Energy Trends */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-green-300">Environmental & Energy Trends</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://bitcoinminingcouncil.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-green-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Mining Council</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://ccaf.io/cbeci/index"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-green-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Cambridge Bitcoin Electricity Consumption Index</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://digiconomist.net/bitcoin-energy-consumption"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-green-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Digiconomist - Bitcoin Energy Index</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://www.energy.gov/articles/bitcoin-mining-energy-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-green-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">U.S. Energy Department - Mining Analysis</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                </div>
              </div>

              {/* 3. Practical Hands-On Mining Experiments */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-purple-300">Practical Hands-On Mining Experiments</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://github.com/bitcoin/bitcoin/tree/master/src/miner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-purple-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Core Mining Code</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://github.com/bitcoinjs/bitcoinjs-lib"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-purple-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">BitcoinJS - JavaScript Mining Tools</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://github.com/btcd/btcd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-purple-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">btcd - Go Bitcoin Node (Mining Support)</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://github.com/rust-bitcoin/rust-bitcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-purple-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Rust-Bitcoin - Mining Libraries</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <a
                    href="https://bitcoin.stackexchange.com/questions/tagged/mining"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-purple-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Bitcoin Stack Exchange - Mining Q&A</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                </div>
                <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                  <p className="mb-2 text-sm font-medium text-purple-200">Experiment Ideas:</p>
                  <ul className="ml-4 space-y-1 text-sm text-zinc-300">
                    <li>• Build a simple CPU miner using Python</li>
                    <li>• Simulate mining difficulty adjustments</li>
                    <li>• Create a mining pool simulator</li>
                    <li>• Analyze block headers and nonces</li>
                    <li>• Study Merkle tree construction</li>
                    <li>• Experiment with different hashing algorithms</li>
                  </ul>
                </div>
              </div>

              {/* 4. Tools, APIs, and Data Sources for Developers */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-cyan-300">🛠️ Tools, APIs, and Data Sources for Developers</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Mining Pool APIs */}
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-cyan-200">Mining Pool APIs</h4>
                      <Database className="h-5 w-5 text-cyan-300" />
                  </div>
                    <div className="space-y-2">
                      <a
                        href="https://www.blockchain.com/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-cyan-500/50"
                      >
                        <span>Blockchain.com API</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://blockstream.info/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-cyan-500/50"
                      >
                        <span>Blockstream API</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://mempool.space/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-cyan-500/50"
                      >
                        <span>Mempool.space API</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                  </div>
                </div>

                  {/* Mining Statistics & Analytics */}
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-orange-200">Mining Statistics & Analytics</h4>
                      <TrendingUp className="h-5 w-5 text-orange-300" />
                    </div>
                    <div className="space-y-2">
                      <a
                        href="https://www.blockchain.com/charts/hash-rate"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-orange-500/50"
                      >
                        <span>Hash Rate Charts</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://btc.com/stats"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-orange-500/50"
                      >
                        <span>BTC.com Mining Stats</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://www.coinwarz.com/mining/bitcoin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-orange-500/50"
                      >
                        <span>CoinWarz Mining Calculator</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                </div>
              </div>

                  {/* Mining Hardware Data */}
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-yellow-200">Mining Hardware Data</h4>
                      <Zap className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div className="space-y-2">
                      <a
                        href="https://www.asicminervalue.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-yellow-500/50"
                      >
                        <span>ASIC Miner Value</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://www.nicehash.com/profitability-calculator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-yellow-500/50"
                      >
                        <span>NiceHash Mining Calculator</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://whattomine.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-yellow-500/50"
                      >
                        <span>WhatToMine - Mining Calculator</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>

                  {/* Block Explorer APIs */}
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-green-200">Block Explorer APIs</h4>
                      <Code className="h-5 w-5 text-green-300" />
                    </div>
                    <div className="space-y-2">
                      <a
                        href="https://blockstream.info/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Blockstream Explorer API</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://www.blockchain.com/api/blockchain_api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Blockchain.com API</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://mempool.space/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Mempool.space API</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Current Industry & Market Developments */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-blue-300">Current Industry & Market Developments</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="https://www.miningpoolstats.stream/bitcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-blue-500/50 hover:bg-zinc-900"
                  >
                    <span className="text-zinc-300">Mining Pool Stats</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                </div>
              </div>

              {/* 6. Bitcoin Mining Communities */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-purple-300">👥 Bitcoin Mining Communities</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Official Forums & Discussion Boards */}
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-yellow-200">Official Forums & Discussion Boards</h4>
                      <Users className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div className="space-y-2">
                      <a
                        href="https://bitcointalk.org/index.php?board=14.0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-yellow-500/50"
                      >
                        <span>BitcoinTalk - Mining Forum</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://bitcoin.stackexchange.com/questions/tagged/mining"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-yellow-500/50"
                      >
                        <span>Bitcoin Stack Exchange</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>

                  {/* Verified Mining Pools */}
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-green-200">Verified Mining Pools</h4>
                      <Users className="h-5 w-5 text-green-300" />
                    </div>
                    <div className="space-y-2">
                      <a
                        href="https://slushpool.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Slush Pool</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://f2pool.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>F2Pool</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://www.antpool.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Antpool</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                      <a
                        href="https://foundryusa.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900/50 p-2 text-sm text-zinc-300 transition hover:border-green-500/50"
                      >
                        <span>Foundry USA Pool</span>
                        <ExternalLink className="h-3 w-3 text-zinc-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          </AnimatedSection>

          {/* SECTION 5 — Mentors & Guest Developers */}
          <AnimatedSection animation="slideLeft">
          <section className="mb-20 rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Mentors & Guest Developers</h2>
            </div>
            <p className="mb-6 text-zinc-400">
              Meet the experienced Bitcoin developers who have been willing to work with us as mentors and guest developers, sharing their knowledge and guiding your journey.
            </p>
            
            {loadingMentors ? (
              <div className="text-center py-8 text-zinc-400">Loading mentors...</div>
            ) : mentors.length > 0 ? (
              <AnimatedList animation="slideLeft" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mentors.map((mentor, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                  >
                <div className="mb-4 flex items-center gap-4">
                      <div className="h-16 w-16 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 overflow-hidden flex items-center justify-center">
                        {mentor.image_url ? (
                          <Image
                            src={mentor.image_url}
                            alt={mentor.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-zinc-300">
                            {mentor.name?.charAt(0)?.toUpperCase() || '👤'}
                          </span>
                        )}
                  </div>
                  <div className="flex-1">
                        <h3 className="font-semibold text-zinc-100">{mentor.name}</h3>
                        <p className="text-sm text-cyan-300">{mentor.role}</p>
                        {mentor.type && (
                          <p className="text-xs text-orange-300">{mentor.type}</p>
                        )}
                  </div>
                </div>
                    {mentor.description && (
                <p className="mb-4 text-sm text-zinc-300">
                        {mentor.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.type && (
                        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300">{mentor.type}</span>
                      )}
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">Mentor</span>
                </div>
                    {(mentor.github || mentor.twitter) && (
                      <div className="flex items-center gap-3 pt-4 border-t border-zinc-700">
                        {mentor.github && (
                          <a
                            href={mentor.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-cyan-400 transition-colors"
                            aria-label={`${mentor.name}'s GitHub`}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                          </a>
                        )}
                        {mentor.twitter && (
                          <a
                            href={mentor.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-cyan-400 transition-colors"
                            aria-label={`${mentor.name}'s Twitter`}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                        )}
              </div>
                    )}
            </div>
                ))}
              </AnimatedList>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <p>No mentors available at this time.</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Approved mentors will appear here automatically from our mentorship database.
                </p>
              </div>
            )}
            
            <div className="mt-8 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
              <p className="text-sm text-cyan-200">
                <strong>Interested in becoming a mentor?</strong> Check out our{' '}
                <Link href="/mentorship" className="underline hover:text-cyan-100">
                  Mentorship Program
                </Link>
              </p>
            </div>
          </section>
          </AnimatedSection>

          {/* SECTION 5 — Developer Meetings, Workshops & Meetups */}
          <AnimatedSection animation="slideRight">
            <section className="mb-20 rounded-xl border border-orange-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/20 p-2">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-50">Developer Meetings, Workshops & Meetups</h2>
            </div>
            <div className="space-y-4">
              {/* TODO: Events will be populated from Supabase Events table */}
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
                  <span className="text-sm text-zinc-400">Last Friday of every month</span>
                </div>
                <p className="text-sm text-zinc-400">Local meetup for Bitcoin developers in Uganda</p>
              </div>
            </div>
          </section>
          </AnimatedSection>

          {/* SECTION 6 — Developer Opportunities for Africans */}
          <AnimatedSection animation="slideLeft">
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
                { name: 'Built with Bitcoin', desc: 'Internship programs', link: 'https://builtwithbitcoin.org' },
                { name: 'Bolt.Fun Bounties', desc: 'Hackathon bounties', link: 'https://bolt.fun' },
                { name: 'AfroBitcoinHack', desc: 'Africa-focused hackathons', link: '#' },
                { name: 'Africa Bitcoin Conference', desc: 'Developer tracks', link: '#' },
                { name: 'BitDevs Events', desc: 'Local developer meetups', link: 'https://bitdevs.org' },
              ].map((opp, idx) => (
                <a
                  key={idx}
                  href={opp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-green-500/50 hover:bg-zinc-900"
                >
                  <h3 className="mb-2 font-semibold text-green-300">{opp.name}</h3>
                  <p className="text-sm text-zinc-400">{opp.desc}</p>
                </a>
              ))}
            </div>
          </section>
          </AnimatedSection>

          {/* SECTION 7 — Build Your First Portfolio Project */}
          <AnimatedSection animation="slideUp">
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
                  <h3 className="font-semibold text-purple-300">{project}</h3>
                </div>
              ))}
            </div>
          </section>
          </AnimatedSection>

          {/* SECTION 8 — Certification Path */}
          <AnimatedSection animation="slideRight">
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
          </AnimatedSection>

          {/* SECTION 9 — Developer FAQs */}
          <AnimatedSection animation="slideLeft">
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
                  a: (
                    <div className="space-y-2">
                      <p>Join our developer community:</p>
                      <ul className="ml-4 space-y-1 text-sm">
                        <li>• <a href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 underline">WhatsApp Developer Group</a></li>
                        <li>• Contact us through our <Link href="/about" className="text-cyan-300 hover:text-cyan-200 underline">About page</Link></li>
                        <li>• Check our <Link href="/mentorship" className="text-cyan-300 hover:text-cyan-200 underline">Mentorship Program</Link> for direct mentor access</li>
                        <li>• Contact our Educators <Link href="maile:admin@panafricanbitcoin.com" className="text-cyan-300 hover:text-cyan-200 underline">Admins</Link> directly</li>
                      </ul>
                      <p className="mt-2">Also use: Bitcoin Stack Exchange, developer mailing lists, Telegram groups, and IRC channels. Be respectful and do your research first. Our community is here to help!</p>
                    </div>
                  ),
                },
              ].map((faq, idx) => (
                <details key={idx} className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                  <summary className="cursor-pointer font-semibold text-cyan-300">{faq.q}</summary>
                  <div className="mt-2 text-zinc-400">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>
          </AnimatedSection>

          {/* CTA Section */}
          <AnimatedSection animation="slideUp">
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
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}

