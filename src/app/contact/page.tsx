import Link from 'next/link';
import { Mail, Github, MessageCircle, Users, Twitter, Music2, Globe } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Pan-African Bitcoin Academy',
  description: 'Get in touch with Pan-African Bitcoin Academy. Join our community on Discord, WhatsApp, Twitter, and more.',
  alternates: {
    canonical: '/contact',
  },
};

const contactMethods = [
  {
    name: 'Email',
    description: 'Send us an email for inquiries and support',
    icon: Mail,
    links: [
      {
        label: 'General Inquiries',
        url: 'mailto:info@panafricanbitcoin.com',
        value: 'info@panafricanbitcoin.com',
      },
    ],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    name: 'Discord',
    description: 'Join our Discord community for discussions and support',
    icon: MessageCircle,
    links: [
      {
        label: 'Join Discord Server',
        url: 'https://discord.gg/4G4TUAP7',
        value: 'discord.gg/4G4TUAP7',
      },
    ],
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
  },
  {
    name: 'WhatsApp',
    description: 'Connect with us on WhatsApp',
    icon: Users,
    links: [
      {
        label: 'Join WhatsApp Group',
        url: 'https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji',
        value: 'WhatsApp Community',
      },
    ],
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    name: 'GitHub',
    description: 'View our open-source projects and contribute',
    icon: Github,
    links: [
      {
        label: 'GitHub Repository',
        url: 'https://github.com/Joie199/pan-africa-bitcoin-academy',
        value: 'github.com/Joie199/pan-africa-bitcoin-academy',
      },
    ],
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/30',
  },
  {
    name: 'X (Twitter)',
    description: 'Follow us on X for updates and announcements',
    icon: Twitter,
    links: [
      {
        label: 'Follow @panafricanbtc',
        url: 'https://x.com/panafricanbtc',
        value: '@panafricanbtc',
      },
    ],
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    name: 'TikTok',
    description: 'Watch our educational content on TikTok',
    icon: Music2,
    links: [
      {
        label: 'Follow @panafricanbitcoin',
        url: 'https://www.tiktok.com/@panafricanbitcoin',
        value: '@panafricanbitcoin',
      },
    ],
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    name: 'Nostr (Jumble)',
    description: 'Connect with us on Nostr',
    icon: Globe,
    links: [
      {
        label: 'Follow on Jumble',
        url: 'https://jumble.social/users/npub1q659nzy6j3mn8nr8ljznzumplesd40276tefj6gjz72npmqqg5cqmh70vv',
        value: 'Jumble Social',
      },
    ],
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <AnimatedSection animation="slideUp">
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Get in Touch
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
              We'd love to hear from you! Connect with us through any of these channels.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <AnimatedSection key={method.name} animation="slideUp" delay={index * 100}>
                <div
                  className={`rounded-xl border ${method.borderColor} ${method.bgColor} p-6 transition hover:scale-105`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-lg ${method.bgColor} p-3`}>
                      <Icon className={`h-6 w-6 ${method.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-50">{method.name}</h3>
                  </div>
                  <p className="mb-4 text-sm text-zinc-400">{method.description}</p>
                  <div className="space-y-2">
                    {method.links.map((link, linkIndex) => (
                      <Link
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-lg border ${method.borderColor} ${method.bgColor} px-4 py-3 text-sm font-medium ${method.color} transition hover:brightness-110`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{link.label}</span>
                          <span className="text-xs opacity-70">→</span>
                        </div>
                        {link.value && (
                          <p className="mt-1 text-xs text-zinc-400">{link.value}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection animation="slideUp" delay={700}>
          <div className="mt-16 rounded-xl border border-cyan-400/25 bg-cyan-500/5 p-8 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-cyan-200">
              Join Our Community
            </h2>
            <p className="mb-6 text-zinc-300">
              The best way to stay connected is through our Discord and WhatsApp communities.
              Join us to ask questions, share ideas, and learn together!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="https://discord.gg/4G4TUAP7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-6 py-3 font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
              >
                <MessageCircle className="h-5 w-5" />
                Join Discord
              </Link>
              <Link
                href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-green-400/50 bg-green-500/10 px-6 py-3 font-semibold text-green-200 transition hover:bg-green-500/20"
              >
                <Users className="h-5 w-5" />
                Join WhatsApp
              </Link>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="slideUp" delay={800}>
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to Home
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

