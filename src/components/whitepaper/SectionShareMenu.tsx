'use client';

import type { ReactNode, SVGProps } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AtSign, ChevronDown, Link2, Mail, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/styles';

const SITE_LABEL = 'Pan-African Bitcoin Academy';

/** Keep GET-based share URLs under typical browser limits. */
const INTENT_TEXT_MAX = 1100;
const SHORT_INTENT_MAX = 380;

function buildFullShare(sectionTitle: string, sectionPlainText: string, pageUrl: string): string {
  const block = sectionPlainText.trim();
  return `${sectionTitle}\n\n${block}\n\n— ${SITE_LABEL}\n${pageUrl}`;
}

function truncateForIntent(fullShare: string, pageUrl: string, maxChars: number): string {
  const footer = `\n\n${pageUrl}`;
  const budget = maxChars - footer.length;
  if (budget < 80) return pageUrl;
  if (fullShare.length <= maxChars) return fullShare;
  return `${fullShare.slice(0, budget - 1).trimEnd()}…${footer}`;
}

function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function IconFacebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function IconLinkedIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

function IconWhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function IconTelegram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

function IconReddit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-2.597c-.117-.116-.247-.2-.39-.25a1.206 1.206 0 0 0-.906 0c-.143.05-.273.134-.39.25L8.898 3.555a1.25 1.25 0 1 1-1.768-1.767l2.59-2.59a2.75 2.75 0 0 1 3.876 0l2.59 2.59a1.25 1.25 0 0 1 0 1.768c-.24.24-.562.37-.9.37zM12 5.963c-1.125 0-2.04.915-2.04 2.04s.915 2.04 2.04 2.04 2.04-.915 2.04-2.04-.915-2.04-2.04-2.04zm0 6.09c-2.25 0-4.08 1.83-4.08 4.08 0 1.208.526 2.292 1.362 3.036a4.08 4.08 0 1 1 0-6.116A4.05 4.05 0 0 1 16.08 12c0-2.25-1.83-4.08-4.08-4.08zm-2.55 4.08c0 .705.57 1.275 1.275 1.275S12 16.838 12 16.133s-.57-1.275-1.275-1.275S9.45 15.428 9.45 16.133zm5.1 0c0 .705-.57 1.275-1.275 1.275s-1.275-.57-1.275-1.275.57-1.275 1.275-1.275 1.275.57 1.275 1.275z"
      />
    </svg>
  );
}

function IconPinterest(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.283 1.194.599 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.350-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"
      />
    </svg>
  );
}

function IconBluesky(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65 1.083 6.479.6.706 2.674.424 4.633-.254 1.065-.356 2.457-.804 3.284-1.04.827.236 2.219.684 3.284 1.04 1.959.678 4.033.96 4.633.254.705-.829 1.083-5.789 1.083-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"
      />
    </svg>
  );
}

function IconNostr(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="currentColor" d="M4 4h3.2l4.8 7.2L16.8 4H20v16h-3.2v-9.6L12 17.6 7.2 10.4V20H4V4z" />
    </svg>
  );
}

const iconCls = 'h-4 w-4 shrink-0 text-zinc-400';

export type SectionShareMenuProps = {
  sectionId: string;
  sectionTitle: string;
  /** Section body only (paragraphs); title is passed separately. */
  sectionPlainText: string;
  onNotify: (message: string) => void;
};

export function SectionShareMenu({
  sectionId,
  sectionTitle,
  sectionPlainText,
  onNotify,
}: SectionShareMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const pageUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/white_paper#${sectionId}` : '';

  const fullShare = useMemo(
    () => buildFullShare(sectionTitle, sectionPlainText, pageUrl),
    [sectionTitle, sectionPlainText, pageUrl],
  );

  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(sectionTitle);

  const intentLong = useMemo(
    () => encodeURIComponent(truncateForIntent(fullShare, pageUrl, INTENT_TEXT_MAX)),
    [fullShare, pageUrl],
  );
  const intentShort = useMemo(
    () => encodeURIComponent(truncateForIntent(fullShare, pageUrl, SHORT_INTENT_MAX)),
    [fullShare, pageUrl],
  );

  /** mailto: length is unreliable; cap body and point to URL for the rest. */
  const mailtoBody = useMemo(() => {
    const max = 1900;
    if (fullShare.length <= max) return fullShare;
    return `${truncateForIntent(fullShare, pageUrl, max - 120)}\n\n(Full text on site — link above.)`;
  }, [fullShare, pageUrl]);

  const encodedMailBody = encodeURIComponent(mailtoBody);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const copyFull = async () => {
    try {
      await navigator.clipboard.writeText(fullShare);
      onNotify('Section text and link copied.');
    } catch {
      onNotify('Copy failed — try manually.');
    }
    close();
  };

  const copyLinkOnly = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      onNotify('Link copied.');
    } catch {
      onNotify('Copy failed — try manually.');
    }
    close();
  };

  const copyForNostr = async () => {
    const body = `${fullShare}\n\n#Bitcoin #Nostr #BTC`;
    try {
      await navigator.clipboard.writeText(body);
      onNotify('Copied for Nostr — paste in your client.');
    } catch {
      onNotify('Copy failed — try manually.');
    }
    close();
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: sectionTitle,
        text: fullShare,
      });
    } catch {
      /* cancelled */
    }
    close();
  };

  type Opt = { key: string; label: string; href: string; icon: ReactNode };

  const options: Opt[] = useMemo(
    () => [
      {
        key: 'email',
        label: 'Email',
        href: `mailto:?subject=${encodedTitle}&body=${encodedMailBody}`,
        icon: <Mail className={iconCls} strokeWidth={1.75} />,
      },
      {
        key: 'x',
        label: 'X',
        href: `https://twitter.com/intent/tweet?text=${intentShort}`,
        icon: <IconX className={iconCls} />,
      },
      {
        key: 'facebook',
        label: 'Facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${intentShort}`,
        icon: <IconFacebook className={iconCls} />,
      },
      {
        key: 'linkedin',
        label: 'LinkedIn',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        icon: <IconLinkedIn className={iconCls} />,
      },
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/?text=${intentLong}`,
        icon: <IconWhatsApp className={iconCls} />,
      },
      {
        key: 'telegram',
        label: 'Telegram',
        href: `https://t.me/share/url?url=${encodedUrl}&text=${intentLong}`,
        icon: <IconTelegram className={iconCls} />,
      },
      {
        key: 'reddit',
        label: 'Reddit',
        href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        icon: <IconReddit className={iconCls} />,
      },
      {
        key: 'bluesky',
        label: 'Bluesky',
        href: `https://bsky.app/intent/compose?text=${intentShort}`,
        icon: <IconBluesky className={iconCls} />,
      },
      {
        key: 'threads',
        label: 'Threads',
        href: `https://www.threads.net/intent/post?text=${intentShort}`,
        icon: <AtSign className={iconCls} strokeWidth={1.75} />,
      },
      {
        key: 'line',
        label: 'LINE',
        href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
        icon: <MessageCircle className={iconCls} strokeWidth={1.75} />,
      },
      {
        key: 'pinterest',
        label: 'Pinterest',
        href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${intentShort}`,
        icon: <IconPinterest className={iconCls} />,
      },
    ],
    [encodedTitle, encodedUrl, intentLong, intentShort, encodedMailBody],
  );

  return (
    <div ref={rootRef} className="relative print:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-0.5 rounded-md border border-zinc-600 px-1.5 py-1.5 text-zinc-300 hover:text-cyan-200',
          open && 'border-zinc-500 text-cyan-200',
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? menuId : undefined}
        title="Share this section"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        <ChevronDown className={cn('h-3 w-3 opacity-60 transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-1 w-[min(calc(100vw-2rem),15rem)] rounded-md border border-zinc-700 bg-zinc-950 py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[10px] text-zinc-500">Share · includes section text where the app allows</p>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => void nativeShare()}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800/80"
            >
              <Share2 className={iconCls} aria-hidden />
              This device…
            </button>
          ) : null}

          {options.map((o) => (
            <a
              key={o.key}
              role="menuitem"
              href={o.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800/80"
            >
              {o.icon}
              {o.label}
            </a>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={() => void copyForNostr()}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800/80"
          >
            <IconNostr className={iconCls} />
            Nostr (copy)
          </button>

          <div className="my-1 border-t border-zinc-800" />

          <button
            type="button"
            role="menuitem"
            onClick={() => void copyFull()}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800/80"
          >
            <Link2 className={iconCls} aria-hidden />
            Copy text + link
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void copyLinkOnly()}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/80"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            Link only
          </button>
        </div>
      ) : null}
    </div>
  );
}
