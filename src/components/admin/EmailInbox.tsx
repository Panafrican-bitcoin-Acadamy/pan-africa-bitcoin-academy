'use client';

import { useState, useEffect } from 'react';
import { Inbox, Mail, RefreshCw, ChevronRight, X, Paperclip } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ReceivedEmail {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  created_at: string;
  attachments?: Array<{
    id: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
}

interface FullEmail extends ReceivedEmail {
  html?: string;
  text?: string;
}

export function EmailInbox() {
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<FullEmail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchEmails = async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (cursor) params.set('after', cursor);
      const res = await fetch(`/api/admin/email/received?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to fetch received emails');
      }

      setEmails(data.emails || []);
      setHasMore(data.hasMore ?? false);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmailDetail = async (email: ReceivedEmail) => {
    setSelectedEmail({ ...email, html: undefined, text: undefined });
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/email/received/${email.id}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load email');
      }

      setSelectedEmail(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email');
      setSelectedEmail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Inbox className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Inbox</h2>
            <p className="text-xs text-zinc-400">Received emails (Resend Receiving)</p>
          </div>
        </div>
        <button
          onClick={() => fetchEmails()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          {error}
          <p className="text-xs text-amber-300/80 mt-1">
            Receiving requires Resend&apos;s Inbound feature. Configure your domain in the Resend dashboard.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-zinc-400">Loading inbox...</span>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50 mb-4">
            <Mail className="h-8 w-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 font-medium">No received emails</p>
          <p className="text-xs text-zinc-500 mt-1">
            Inbound emails will appear here once Resend Receiving is configured.
          </p>
        </div>
      ) : (
        <div className="space-y-1 overflow-hidden">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => fetchEmailDetail(email)}
              className="w-full text-left px-4 py-3 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-200 truncate">{email.from}</span>
                  {(email.attachments?.length ?? 0) > 0 && (
                    <Paperclip className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-zinc-400 truncate mt-0.5">{email.subject || '(No subject)'}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                </p>
              </div>
              <span className="text-xs text-zinc-500 flex-shrink-0">{formatDate(email.created_at)}</span>
              <ChevronRight className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-50 truncate pr-4">
                {selectedEmail.subject || '(No subject)'}
              </h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-zinc-800 text-sm space-y-2">
              <div>
                <span className="text-zinc-500">From:</span>{' '}
                <span className="text-zinc-200">{selectedEmail.from}</span>
              </div>
              <div>
                <span className="text-zinc-500">To:</span>{' '}
                <span className="text-zinc-200">
                  {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Date:</span>{' '}
                <span className="text-zinc-200">
                  {new Date(selectedEmail.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="md" />
                </div>
              ) : selectedEmail.html ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-zinc-200"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              ) : selectedEmail.text ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans">
                  {selectedEmail.text}
                </pre>
              ) : (
                <p className="text-zinc-500 italic">No content available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
