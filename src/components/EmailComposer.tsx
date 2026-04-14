'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Paperclip, Send, Trash2, Maximize2, Minimize2, Clock, Save, ChevronDown, User, Plus, Copy } from 'lucide-react';

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

interface SavedSender {
  id: string;
  name: string;
  email: string;
  replyTo?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const MILESTONE_TEMPLATE: EmailTemplate = {
  id: 'milestone-tigrigna-whitepaper',
  name: 'Milestone: Whitepaper in Tigrigna',
  subject: '🚀 Milestone Achieved: Bitcoin Whitepaper Now in Tigrigna',
  body: `
    <div style="max-width:640px;margin:0 auto;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#e5e7eb;background:#02000a;border:1px solid rgba(34,211,238,0.28);border-radius:10px;overflow:hidden;">
      <div style="padding:20px 18px 16px;text-align:center;border-bottom:1px solid rgba(34,211,238,0.24);background:linear-gradient(180deg,#090f1d 0%,#050914 100%);">
        <img src="https://panafricanbitcoin.com/images/logo_3.png" alt="Pan-African Bitcoin Academy logo" width="64" height="64" style="display:block;margin:0 auto 10px;object-fit:contain;" />
        <div style="font-size:22px;line-height:1.2;color:#f8fafc;font-weight:800;letter-spacing:0.01em;">Pan-African ₿itcoin Academy</div>
      </div>
      <div style="padding:16px 16px 16px;">
        <p style="margin:0 0 14px;text-align:center;font-size:30px;line-height:1.35;color:#f8fafc;font-weight:800;width:100%;">
          ቢትኮይን፡ ስርዓት ናይ መዘና-ናብ-መዘና ኤሌክትሮኒካዊ ገንዘብ
        </p>
        <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#d1d5db;">We are writing to share an important milestone from our team. We have successfully translated the Bitcoin Whitepaper into Tigrigna, making this foundational document accessible to a broader community that has historically been underserved in Bitcoin education.</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#d1d5db;">This achievement reflects our ongoing commitment to expanding open, inclusive access to Bitcoin knowledge. By providing the whitepaper in Tigrigna, we aim to empower more individuals to understand, engage with, and build on this technology from a position of clarity and independence.</p>
        <div style="margin:0 0 8px;text-align:center;">
          <a href="https://panafricanbitcoin.com/white_paper" style="display:inline-block;padding:10px 16px;border-radius:8px;background:linear-gradient(135deg,#f97316 0%,#22d3ee 100%);color:#020617;text-decoration:none;font-weight:800;font-size:13px;">Visit Website Whitepaper</a>
        </div>
        <div style="margin:0 0 10px;padding:6px;border:1px solid rgba(34,211,238,0.22);border-radius:7px;background:#070d1a;text-align:center;">
          <a href="https://panafricanbitcoin.com/white_paper" style="text-decoration:none;">
            <img src="https://image.thum.io/get/width/1240/crop/900/https://panafricanbitcoin.com/white_paper" alt="Pan-African Bitcoin Academy whitepaper page preview" width="604" style="display:block;width:100%;max-width:604px;height:auto;border-radius:5px;border:1px solid #1f2937;" />
          </a>
        </div>
        <div style="margin:0 0 10px;text-align:center;">
          <a href="https://panafricanbitcoin.com/doc_files/Bitcoin%20white%20paper%20Tigrigna.pdf" style="display:inline-block;padding:10px 16px;border-radius:8px;border:1px solid #f97316;color:#fdba74;text-decoration:none;font-weight:700;font-size:13px;margin-bottom:6px;background:rgba(249,115,22,0.08);">Download Tigrigna PDF</a>
        </div>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d1d5db;">We would value your feedback and support as we continue developing open-source educational materials and tools.</p>
        <p style="margin:0;font-size:13px;line-height:1.55;color:#d1d5db;">Thank you for being part of this journey.<br/><strong style="color:#f8fafc;">Pan-African ₿itcoin Academy Team</strong></p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px auto 0;border-collapse:collapse;font-size:11px;line-height:1.2;">
          <tr>
            <td style="padding:0 4px;"><a href="https://panafricanbitcoin.com" style="color:#67e8f9;text-decoration:none;">panafricanbitcoin.com</a></td>
            <td style="padding:0 2px;color:#475569;">&middot;</td>
            <td style="padding:0 4px;"><a href="https://x.com/panafricanbtc" style="color:#9dd6ff;text-decoration:none;">X</a></td>
            <td style="padding:0 2px;color:#475569;">&middot;</td>
            <td style="padding:0 4px;"><a href="https://www.facebook.com/profile.php?id=61586743276906" style="color:#9dd6ff;text-decoration:none;">Facebook</a></td>
            <td style="padding:0 2px;color:#475569;">&middot;</td>
            <td style="padding:0 4px;"><a href="https://www.instagram.com/panafricanbitcoin/" style="color:#9dd6ff;text-decoration:none;">Instagram</a></td>
            <td style="padding:0 2px;color:#475569;">&middot;</td>
            <td style="padding:0 4px;"><a href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji" style="color:#9dd6ff;text-decoration:none;">WhatsApp</a></td>
            <td style="padding:0 2px;color:#475569;">&middot;</td>
            <td style="padding:0 4px;"><a href="https://discord.gg/4G4TUAP7" style="color:#9dd6ff;text-decoration:none;">Discord</a></td>
          </tr>
        </table>
        <p style="margin:7px 0 0;font-size:10px;line-height:1.45;color:#94a3b8;"><strong>N.B.</strong> This is not a newsletter; we are sharing our milestone.</p>
      </div>
    </div>
  `,
};

const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'blank', name: 'Blank', subject: '', body: '' },
  { id: 'welcome', name: 'Welcome', subject: 'Welcome to Pan African Bitcoin Academy', body: '<p>Hello,</p><p>Welcome to the Pan African Bitcoin Academy! We\'re excited to have you join our program.</p><p>Best regards,<br/>Pan African Bitcoin Academy Team</p>' },
  { id: 'reminder', name: 'Session Reminder', subject: 'Reminder: Upcoming Session', body: '<p>Hello,</p><p>This is a friendly reminder about our upcoming session.</p><p>We look forward to seeing you!</p><p>Best regards,<br/>Pan African Bitcoin Academy</p>' },
  { id: 'announcement', name: 'Announcement', subject: 'Important Announcement', body: '<p>Hello everyone,</p><p>We have an important announcement to share with you.</p><p>Please take a moment to read the details below.</p><p>Best regards,<br/>Pan African Bitcoin Academy</p>' },
  { id: 'followup', name: 'Follow-up', subject: 'Following up', body: '<p>Hello,</p><p>I wanted to follow up on our previous conversation.</p><p>Please let me know if you have any questions.</p><p>Best regards</p>' },
  MILESTONE_TEMPLATE,
];

export default function EmailComposer({ 
  onClose, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '' 
}: EmailComposerProps) {
  const [fromName, setFromName] = useState('Pan-African Bitcoin Academy');
  const [fromEmail, setFromEmail] = useState('noreply@panafricanbitcoin.com');
  const [replyTo, setReplyTo] = useState('');
  const [showReplyTo, setShowReplyTo] = useState(false);
  const [savedSenders, setSavedSenders] = useState<SavedSender[]>(() => {
    try {
      const s = localStorage.getItem('email-saved-senders');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [showSenderPresets, setShowSenderPresets] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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
        replyTo,
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
        if (draft.replyTo) {
          setReplyTo(draft.replyTo);
          setShowReplyTo(true);
        }
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

  const applyTemplate = (t: EmailTemplate) => {
    if (t.subject) setSubject(t.subject);
    if (t.body && bodyRef.current) {
      const compactHtml = t.body
        .replace(/\r\n/g, '\n')
        .replace(/>\s+\n\s+</g, '><')
        .replace(/\n{2,}/g, '\n')
        .trim();
      bodyRef.current.innerHTML = compactHtml;
      setBody(compactHtml);
      setHasBodyText(true);
    }
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

      const payload: Record<string, unknown> = {
        from: fromFormatted,
        to: toRecipients.map(r => r.email),
        cc: ccRecipients.map(r => r.email),
        bcc: bccRecipients.map(r => r.email),
        subject: subject.trim(),
        body: emailBody,
      };
      if (replyTo.trim() && validateEmail(replyTo.trim())) {
        payload.replyTo = replyTo.trim();
      }

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
      setFromName('Pan-African Bitcoin Academy');
      setFromEmail('noreply@panafricanbitcoin.com');
      setReplyTo('');
      setShowReplyTo(false);
      if (bodyRef.current) {
        bodyRef.current.innerHTML = '';
      }
    }
  };

  const handleCopyHtml = async () => {
    const html = (bodyRef.current?.innerHTML || body || '').trim();
    if (!html) {
      setError('Nothing to copy yet. Load or write an email first.');
      return;
    }

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html.replace(/<[^>]+>/g, '').trim()], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      setSuccess('Full HTML copied (including inline styles/background).');
    } catch {
      setError('Copy failed. Try selecting the content manually.');
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
        {/* From Field - improved layout with name and email */}
        <div className="px-4 py-3 border-b border-zinc-700 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              From:
            </label>
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const name = fromName.trim();
                  const email = fromEmail.trim();
                  if (name && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    const newSender: SavedSender = {
                      id: `sender-${Date.now()}`,
                      name,
                      email,
                      replyTo: replyTo.trim() || undefined,
                    };
                    const updated = [...savedSenders, newSender];
                    setSavedSenders(updated);
                    localStorage.setItem('email-saved-senders', JSON.stringify(updated));
                  }
                }}
                className="text-xs text-zinc-500 hover:text-cyan-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
                title="Save current sender as preset"
              >
                <Save className="w-3 h-3" />
                Save preset
              </button>
              {savedSenders.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSenderPresets(!showSenderPresets)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSenderPresets ? 'rotate-180' : ''}`} />
                    Saved senders
                  </button>
                  {showSenderPresets && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSenderPresets(false)} aria-hidden="true" />
                      <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl py-1 max-h-48 overflow-y-auto">
                        {savedSenders.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setFromName(s.name);
                              setFromEmail(s.email);
                              setReplyTo(s.replyTo || '');
                              setShowSenderPresets(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                          >
                            <div className="font-medium truncate">{s.name}</div>
                            <div className="text-xs text-zinc-400 truncate">{s.email}</div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const name = fromName.trim();
                            const email = fromEmail.trim();
                            if (name && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              const newSender: SavedSender = {
                                id: `sender-${Date.now()}`,
                                name,
                                email,
                                replyTo: replyTo.trim() || undefined,
                              };
                              const updated = [...savedSenders, newSender];
                              setSavedSenders(updated);
                              localStorage.setItem('email-saved-senders', JSON.stringify(updated));
                              setShowSenderPresets(false);
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cyan-400 hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Save current as preset
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Display Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g. Pan African Bitcoin Academy"
                className="w-full text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email Address</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="e.g. noreply@panafricanbitcoin.com"
                className="w-full text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-zinc-500"
              />
            </div>
          </div>
          {showReplyTo && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Reply-To (optional)</label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="Replies will go to this address"
                className="w-full text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-zinc-500"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowReplyTo(!showReplyTo)}
            className="text-xs text-cyan-500 hover:text-cyan-400"
          >
            {showReplyTo ? '− Hide Reply-To' : '+ Add Reply-To address'}
          </button>
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

        {/* Templates & Formatting Toolbar */}
        <div className="px-4 py-2 border-b border-zinc-700 bg-zinc-800 flex flex-wrap items-center gap-2">
          <div className="relative mr-2">
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 rounded transition border border-zinc-600"
            >
              <span>Template</span>
              <ChevronDown className={`w-3.5 h-3.5 ${showTemplates ? 'rotate-180' : ''}`} />
            </button>
            {showTemplates && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} aria-hidden="true" />
                <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl py-1 max-h-64 overflow-y-auto">
                  {EMAIL_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        applyTemplate(t);
                        setShowTemplates(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                    >
                      <div className="font-medium">{t.name}</div>
                      {t.subject && <div className="text-xs text-zinc-500 truncate">{t.subject}</div>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="w-px h-4 bg-zinc-600" />
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
          <button
            onClick={() => applyFormatting('strikeThrough')}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
            title="Strikethrough"
          >
            <span className="text-sm line-through text-zinc-300">S</span>
          </button>
          <div className="w-px h-4 bg-zinc-600" />
          <button
            onClick={() => applyFormatting('formatBlock', 'h2')}
            className="p-1.5 hover:bg-zinc-700 rounded transition text-xs font-semibold text-zinc-300"
            title="Heading"
          >
            H2
          </button>
          <button
            onClick={() => applyFormatting('formatBlock', 'h3')}
            className="p-1.5 hover:bg-zinc-700 rounded transition text-xs font-semibold text-zinc-300"
            title="Subheading"
          >
            H3
          </button>
          <button
            onClick={() => applyFormatting('formatBlock', 'p')}
            className="p-1.5 hover:bg-zinc-700 rounded transition text-xs text-zinc-300"
            title="Paragraph"
          >
            P
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

        {/* Quick milestone section for Communications > Email Composition */}
        <div className="mx-4 mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Milestone Newsletter</p>
              <p className="mt-1 text-sm text-zinc-200">🚀 Milestone Achieved: Bitcoin Whitepaper Now in Tigrigna</p>
            </div>
            <button
              type="button"
              onClick={() => applyTemplate(MILESTONE_TEMPLATE)}
              className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
            >
              Load into composer
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Clean announcement layout with clear sections and direct action links.
          </p>
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
            onClick={handleCopyHtml}
            className="px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded transition cursor-pointer inline-flex items-center gap-1.5"
            title="Copy full HTML email draft"
          >
            <Copy className="w-4 h-4" />
            Copy HTML
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

