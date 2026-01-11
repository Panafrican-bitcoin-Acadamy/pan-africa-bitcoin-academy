'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Paperclip, Send, Trash2, Maximize2, Minimize2, Clock, Save } from 'lucide-react';

interface EmailComposerProps {
  onClose?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

interface RecipientChip {
  id: string;
  email: string;
  label?: string;
}

export default function EmailComposer({ 
  onClose, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '' 
}: EmailComposerProps) {
  const [fromName, setFromName] = useState('PanAfrican Bitcoin Academy');
  const [fromEmail, setFromEmail] = useState('noreply@panafricanbitcoin.com');
  const [toRecipients, setToRecipients] = useState<RecipientChip[]>(() => {
    if (initialTo) {
      return initialTo.split(',').map((email, idx) => ({
        id: `to-${idx}`,
        email: email.trim(),
      })).filter(r => r.email);
    }
    return [];
  });
  const [ccRecipients, setCcRecipients] = useState<RecipientChip[]>([]);
  const [bccRecipients, setBccRecipients] = useState<RecipientChip[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Initialize body content
  useEffect(() => {
    if (bodyRef.current && initialBody && !bodyRef.current.innerHTML) {
      bodyRef.current.innerHTML = initialBody;
      setBody(initialBody);
    }
  }, [initialBody]);

  // Clear body ref when body is cleared
  useEffect(() => {
    if (bodyRef.current && !body && bodyRef.current.innerHTML) {
      bodyRef.current.innerHTML = '';
    }
  }, [body]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (subject || body || toRecipients.length > 0) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [subject, body, toRecipients, ccRecipients, bccRecipients]);

  const saveDraft = async () => {
    try {
      const draft = {
        fromName,
        fromEmail,
        to: toRecipients.map(r => r.email).join(','),
        cc: ccRecipients.map(r => r.email).join(','),
        bcc: bccRecipients.map(r => r.email).join(','),
        subject,
        body,
      };
      localStorage.setItem('email-draft', JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (err) {
      // Silent fail for draft saving
    }
  };

  const loadDraft = () => {
    try {
      const draftStr = localStorage.getItem('email-draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft.fromName) setFromName(draft.fromName);
        if (draft.fromEmail) setFromEmail(draft.fromEmail);
        if (draft.to) {
          setToRecipients(draft.to.split(',').map((email: string, idx: number) => ({
            id: `to-${idx}`,
            email: email.trim(),
          })).filter((r: RecipientChip) => r.email));
        }
        if (draft.cc) {
          setCcRecipients(draft.cc.split(',').map((email: string, idx: number) => ({
            id: `cc-${idx}`,
            email: email.trim(),
          })).filter((r: RecipientChip) => r.email));
        }
        if (draft.bcc) {
          setBccRecipients(draft.bcc.split(',').map((email: string, idx: number) => ({
            id: `bcc-${idx}`,
            email: email.trim(),
          })).filter((r: RecipientChip) => r.email));
        }
        if (draft.subject) setSubject(draft.subject);
        if (draft.body) setBody(draft.body);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addRecipient = (
    email: string,
    recipients: RecipientChip[],
    setRecipients: (recipients: RecipientChip[]) => void
  ) => {
    const trimmed = email.trim();
    if (!trimmed || !validateEmail(trimmed)) return;

    if (recipients.some(r => r.email.toLowerCase() === trimmed.toLowerCase())) return;

    setRecipients([
      ...recipients,
      { id: `${Date.now()}-${Math.random()}`, email: trimmed }
    ]);
  };

  const removeRecipient = (
    id: string,
    recipients: RecipientChip[],
    setRecipients: (recipients: RecipientChip[]) => void
  ) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const handleRecipientInput = (
    e: KeyboardEvent<HTMLInputElement>,
    recipients: RecipientChip[],
    setRecipients: (recipients: RecipientChip[]) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value;
      if (value) {
        const emails = value.split(',').map(e => e.trim()).filter(e => e);
        emails.forEach(email => addRecipient(email, recipients, setRecipients));
        e.currentTarget.value = '';
      }
    } else if (e.key === 'Backspace' && e.currentTarget.value === '' && recipients.length > 0) {
      removeRecipient(recipients[recipients.length - 1].id, recipients, setRecipients);
    }
  };

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    bodyRef.current?.focus();
  };

  const handleSend = async () => {
    if (toRecipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    // Get body content from contentEditable div - always prefer the div content
    let emailBody = '';
    if (bodyRef.current) {
      const htmlContent = bodyRef.current.innerHTML || '';
      const textContent = bodyRef.current.innerText || bodyRef.current.textContent || '';
      
      // Use HTML if it has meaningful content, otherwise use plain text
      if (htmlContent.trim().length > 0) {
        // Check if HTML has actual text (not just empty tags)
        const textOnly = htmlContent
          .replace(/<br\s*\/?>/gi, '')
          .replace(/<div><\/div>/g, '')
          .replace(/<p><\/p>/g, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        if (textOnly.length > 0) {
          emailBody = htmlContent.trim();
        } else if (textContent.trim().length > 0) {
          emailBody = textContent.trim();
        }
      } else if (textContent.trim().length > 0) {
        emailBody = textContent.trim();
      }
    }
    
    // Fallback to state if div is empty
    if (!emailBody && body && body.trim().length > 0) {
      const textOnly = body
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<div><\/div>/g, '')
        .replace(/<p><\/p>/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      if (textOnly.length > 0) {
        emailBody = body.trim();
      }
    }

    // Final validation
    if (!emailBody || emailBody.trim().length === 0) {
      setError('Please enter email body content');
      return;
    }
    
    // Additional check - make sure it's not just whitespace or empty tags
    const finalTextCheck = emailBody
      .replace(/<br\s*\/?>/gi, '')
      .replace(/<div><\/div>/g, '')
      .replace(/<p><\/p>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (finalTextCheck.length === 0) {
      setError('Please enter email body content');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      // Format from as "Name <email>"
      const fromFormatted = `${fromName.trim()} <${fromEmail.trim()}>`;

      const payload = {
        from: fromFormatted,
        to: toRecipients.map(r => r.email),
        cc: ccRecipients.map(r => r.email),
        bcc: bccRecipients.map(r => r.email),
        subject: subject.trim(),
        body: emailBody,
      };

      console.log('Sending email:', { ...payload, body: emailBody.substring(0, 100) + '...' });

      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Email send error:', data);
        throw new Error(data.error || data.details || 'Failed to send email');
      }

      console.log('Email sent successfully:', data);
      setSuccess('Email sent successfully!');
      localStorage.removeItem('email-draft');
      
      // Clear form after successful send
      setTimeout(() => {
        setToRecipients([]);
        setCcRecipients([]);
        setBccRecipients([]);
        setSubject('');
        setBody('');
        if (bodyRef.current) {
          bodyRef.current.innerHTML = '';
        }
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Email send error:', err);
      setError(err.message || 'Failed to send email. Please check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteDraft = () => {
    if (confirm('Delete this draft?')) {
      localStorage.removeItem('email-draft');
      setToRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setSubject('');
      setBody('');
      setFromName('PanAfrican Bitcoin Academy');
      setFromEmail('noreply@panafricanbitcoin.com');
      if (bodyRef.current) {
        bodyRef.current.innerHTML = '';
      }
    }
  };

  // Track body content for canSend check - update on every input
  const [hasBodyText, setHasBodyText] = useState(false);

  // Helper function to check if body has content
  const checkBodyHasContent = (): boolean => {
    // First check the contentEditable div directly (most reliable)
    if (bodyRef.current) {
      // Try multiple methods to get text content
      const textContent = bodyRef.current.innerText || bodyRef.current.textContent || '';
      if (textContent.trim().length > 0) {
        return true;
      }
      
      // Check HTML content - strip tags and check for text
      const htmlContent = bodyRef.current.innerHTML || '';
      if (htmlContent.trim().length > 0) {
        // Remove common empty HTML patterns
        const cleaned = htmlContent
          .replace(/<br\s*\/?>/gi, '')
          .replace(/<div><\/div>/g, '')
          .replace(/<p><\/p>/g, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        if (cleaned.length > 0) {
          return true;
        }
      }
    }
    
    // Fallback to state
    if (body && body.trim().length > 0) {
      const textOnly = body
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<div><\/div>/g, '')
        .replace(/<p><\/p>/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      return textOnly.length > 0;
    }
    
    return false;
  };

  // Update hasBodyText whenever body or contentEditable changes
  useEffect(() => {
    const checkBodyContent = () => {
      const hasContent = checkBodyHasContent();
      setHasBodyText(hasContent);
    };

    checkBodyContent();
    // Check more frequently to catch all changes
    const interval = setInterval(checkBodyContent, 300);
    return () => clearInterval(interval);
  }, [body]);

  const canSend = toRecipients.length > 0 && subject.trim().length > 0 && hasBodyText;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-zinc-900 rounded-lg shadow-lg border border-zinc-700 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-50">New Message</h3>
        <div className="flex items-center gap-2">
          {draftSaved && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Save className="w-3 h-3" />
              Draft saved
            </span>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-zinc-800 rounded transition"
            title={isFullscreen ? 'Minimize' : 'Maximize'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-zinc-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded transition"
              title="Close"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Email Form */}
      <div className="flex-1 overflow-y-auto">
        {/* From Field */}
        <div className="px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-400 w-12">From:</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Sender Name"
                className="flex-1 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-zinc-500 text-sm">&lt;</span>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="email@domain.com"
                className="flex-1 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-zinc-500 text-sm">&gt;</span>
            </div>
          </div>
        </div>

        {/* To Field */}
        <div className="px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-400 w-12">To:</label>
            <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[32px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              {toRecipients.map((recipient) => (
                <span
                  key={recipient.id}
                  className="inline-flex items-center gap-1 bg-blue-900/50 text-blue-300 border border-blue-700/50 text-xs px-2 py-0.5 rounded"
                >
                  {recipient.email}
                  <button
                    onClick={() => removeRecipient(recipient.id, toRecipients, setToRecipients)}
                    className="hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={toInputRef}
                type="text"
                placeholder={toRecipients.length === 0 ? "Recipients" : ""}
                onKeyDown={(e) => handleRecipientInput(e, toRecipients, setToRecipients, toInputRef)}
                className="flex-1 min-w-[120px] text-sm text-zinc-100 bg-transparent outline-none border-none placeholder:text-zinc-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowCc(!showCc);
                  if (!showCc) setTimeout(() => ccInputRef.current?.focus(), 0);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
              >
                Cc
              </button>
              <button
                onClick={() => {
                  setShowBcc(!showBcc);
                  if (!showBcc) setTimeout(() => bccInputRef.current?.focus(), 0);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
              >
                Bcc
              </button>
            </div>
          </div>
        </div>

        {/* Cc Field */}
        {showCc && (
          <div className="px-4 py-2 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-400 w-12">Cc:</label>
              <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[32px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                {ccRecipients.map((recipient) => (
                  <span
                    key={recipient.id}
                    className="inline-flex items-center gap-1 bg-blue-900/50 text-blue-300 border border-blue-700/50 text-xs px-2 py-0.5 rounded"
                  >
                    {recipient.email}
                    <button
                      onClick={() => removeRecipient(recipient.id, ccRecipients, setCcRecipients)}
                      className="hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={ccInputRef}
                  type="text"
                  placeholder="Cc"
                  onKeyDown={(e) => handleRecipientInput(e, ccRecipients, setCcRecipients, ccInputRef)}
                  className="flex-1 min-w-[120px] text-sm text-zinc-100 bg-transparent outline-none border-none placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bcc Field */}
        {showBcc && (
          <div className="px-4 py-2 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-400 w-12">Bcc:</label>
              <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[32px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                {bccRecipients.map((recipient) => (
                  <span
                    key={recipient.id}
                    className="inline-flex items-center gap-1 bg-blue-900/50 text-blue-300 border border-blue-700/50 text-xs px-2 py-0.5 rounded"
                  >
                    {recipient.email}
                    <button
                      onClick={() => removeRecipient(recipient.id, bccRecipients, setBccRecipients)}
                      className="hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={bccInputRef}
                  type="text"
                  placeholder="Bcc"
                  onKeyDown={(e) => handleRecipientInput(e, bccRecipients, setBccRecipients, bccInputRef)}
                  className="flex-1 min-w-[120px] text-sm text-zinc-100 bg-transparent outline-none border-none placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Subject Field */}
        <div className="px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-400 w-12">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 text-sm text-zinc-100 bg-transparent outline-none border-none placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="px-4 py-2 border-b border-zinc-700 bg-zinc-800 flex items-center gap-2">
          <button
            onClick={() => applyFormatting('bold')}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Bold"
          >
            <span className="text-sm font-bold text-zinc-300">B</span>
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Italic"
          >
            <span className="text-sm italic text-zinc-300">I</span>
          </button>
          <button
            onClick={() => applyFormatting('underline')}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Underline"
          >
            <span className="text-sm underline text-zinc-300">U</span>
          </button>
          <div className="w-px h-4 bg-zinc-600" />
          <button
            onClick={() => applyFormatting('insertUnorderedList')}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Bullet List"
          >
            <span className="text-sm text-zinc-300">•</span>
          </button>
          <button
            onClick={() => applyFormatting('insertOrderedList')}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Numbered List"
          >
            <span className="text-sm text-zinc-300">1.</span>
          </button>
          <div className="w-px h-4 bg-zinc-600" />
          <button
            onClick={() => {
              const url = prompt('Enter URL:');
              if (url) applyFormatting('createLink', url);
            }}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Insert Link"
          >
            <span className="text-sm text-zinc-300">🔗</span>
          </button>
          <button
            className="p-1.5 hover:bg-zinc-700 rounded transition opacity-50 cursor-not-allowed"
            title="Attach File (Coming Soon)"
          >
            <Paperclip className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body Editor */}
        <div className="px-4 py-3 flex-1 min-h-[200px]">
          <div
            ref={bodyRef}
            contentEditable
            onInput={(e) => {
              const html = e.currentTarget.innerHTML;
              setBody(html);
              // Immediately check if we have content using the same logic
              const textContent = e.currentTarget.innerText || e.currentTarget.textContent || '';
              const cleanedHtml = html
                .replace(/<br\s*\/?>/gi, '')
                .replace(/<div><\/div>/g, '')
                .replace(/<p><\/p>/g, '')
                .replace(/<[^>]*>/g, '')
                .trim();
              setHasBodyText(textContent.trim().length > 0 || cleanedHtml.length > 0);
            }}
            onBlur={(e) => {
              // Ensure body state is synced on blur
              const html = e.currentTarget.innerHTML;
              setBody(html);
            }}
            className="min-h-[150px] text-sm text-zinc-100 outline-none focus:outline-none"
            style={{ whiteSpace: 'pre-wrap' }}
            data-placeholder="Compose your message…"
            suppressContentEditableWarning
          />
          <style jsx>{`
            [contenteditable][data-placeholder]:empty:before {
              content: attr(data-placeholder);
              color: #71717a;
              pointer-events: none;
            }
          `}</style>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="px-4 py-2 bg-red-900/20 border-t border-red-700">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="px-4 py-2 bg-green-900/20 border-t border-green-700">
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }}
            disabled={isSending}
            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded transition ${
              canSend && !isSending
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-zinc-600 opacity-50 cursor-not-allowed'
            }`}
            title={!canSend ? 'Please fill in recipient, subject, and body' : 'Send email'}
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Sending...' : 'Send'}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded transition cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled
            className="px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded transition opacity-50 cursor-not-allowed"
            title="Schedule Send (Coming Soon)"
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Schedule
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteDraft}
            className="p-2 text-zinc-300 hover:bg-zinc-700 rounded transition cursor-pointer"
            title="Delete Draft"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

