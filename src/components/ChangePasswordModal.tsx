'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, Eye, EyeOff, Check, Circle } from 'lucide-react';
import { validatePassword, getPasswordRequirementStatuses, PASSWORD_REQUIREMENTS_HEADING, PASSWORD_REQUIREMENTS_HEADING_TIGRINYA, CONFIRM_NEW_PASSWORD_LABEL, CONFIRM_PASSWORD_LABEL_TIGRINYA } from '@/lib/passwordValidation';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    setErrors({});
    setSuccess(false);

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Old password is required';
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      // Strong password validation
      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.errors[0] || 'Password does not meet requirements';
      }
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.error || 'Failed to change password' });
        return;
      }

      setSuccess(true);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (error: any) {
      setErrors({ submit: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-400/20 bg-zinc-950 p-6 shadow-2xl scrollbar-modal"
        style={{ position: 'relative', zIndex: 100000 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-zinc-50">Change Password</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <div className="mb-2 text-2xl">✓</div>
            <p className="text-sm text-green-200">Password updated successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Old Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  autoComplete="current-password"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 pr-10 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showOldPassword ? "Hide password" : "Show password"}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.oldPassword}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  autoComplete="new-password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 pr-10 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="mt-2">
                <p className="mb-1.5 text-xs font-medium text-zinc-400">
                  {PASSWORD_REQUIREMENTS_HEADING} / {PASSWORD_REQUIREMENTS_HEADING_TIGRINYA}
                </p>
                <div className="space-y-1.5">
                  {getPasswordRequirementStatuses(formData.newPassword).map((req) => (
                    <div
                      key={req.id}
                      className={req.met ? 'text-green-400' : 'text-zinc-500'}
                      style={{ transition: 'color 0.2s ease' }}
                    >
                      <span className="inline-flex items-start gap-2 text-xs">
                        {req.met ? (
                          <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-400" aria-hidden />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-500" aria-hidden />
                        )}
                        <span className={req.met ? 'text-green-400/90' : 'text-zinc-500'}>
                          {req.label} / {req.labelTigrinya}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                {CONFIRM_NEW_PASSWORD_LABEL} / {CONFIRM_PASSWORD_LABEL_TIGRINYA}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-zinc-900/50 px-4 py-3 pr-24 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                    formData.confirmPassword.length > 0
                      ? formData.newPassword === formData.confirmPassword
                        ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-zinc-700 focus:border-cyan-400/50 focus:ring-cyan-400/20'
                  }`}
                  placeholder="Confirm your new password"
                />
                {formData.confirmPassword.length > 0 && (
                  <span className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none">
                    {formData.newPassword === formData.confirmPassword ? (
                      <Check className="h-5 w-5 text-emerald-400" aria-hidden />
                    ) : (
                      <X className="h-5 w-5 text-red-400" aria-hidden />
                    )}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.submit && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {errors.submit}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

