'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Mail, Phone, MapPin, Briefcase, Shield, CheckCircle2, XCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  accessLevel: string;
  phone: string;
  country: string;
  city: string;
  notes: string;
  emailVerified: boolean;
  requiresPasswordChange: boolean;
  createdAt: string;
  createdBy: string | null;
  isLocked: boolean;
  failedLoginAttempts: number;
}

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  accessLevel: string;
  phone: string;
  country: string;
  city: string;
  notes: string;
  temporaryPassword: string;
}

const ACCESS_LEVELS = [
  { value: 'standard', label: 'Standard', description: 'Basic admin access' },
  { value: 'elevated', label: 'Elevated', description: 'Moderate permissions' },
  { value: 'full', label: 'Full', description: 'All permissions' },
];

export function AdminAccessManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminFormData>({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    accessLevel: 'standard',
    phone: '',
    country: '',
    city: '',
    notes: '',
    temporaryPassword: '',
  });

  // Fetch admins on mount
  useEffect(() => {
    console.log('[AdminAccessManagement] Component mounted, fetching admins...');
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/list', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdmins(data.admins || []);
      } else {
        // Don't set error for initial load - just show empty list
        console.error('Failed to fetch admins:', data.error);
        setAdmins([]);
      }
    } catch (err: any) {
      // Don't block rendering on error - just log it
      console.error('Error fetching admins:', err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, temporaryPassword: password });
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || 'Admin account created successfully!');
        // Show generated password if it was auto-generated
        if (data.temporaryPassword) {
          setGeneratedPassword(data.temporaryPassword);
          setShowPassword(true);
        }
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          position: '',
          accessLevel: 'standard',
          phone: '',
          country: '',
          city: '',
          notes: '',
          temporaryPassword: '',
        });
        // Refresh admin list
        await fetchAdmins();
      } else {
        setError(data.error || 'Failed to create admin account');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create admin account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Admin "${adminName}" deleted successfully`);
        await fetchAdmins();
      } else {
        setError(data.error || 'Failed to delete admin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete admin');
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const levelConfig = ACCESS_LEVELS.find(l => l.value === level) || ACCESS_LEVELS[0];
    const colors = {
      standard: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      elevated: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      full: 'bg-red-500/20 text-red-300 border-red-500/50',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colors[level as keyof typeof colors] || colors.standard}`}>
        <Shield className="h-3 w-3" />
        {levelConfig.label}
      </span>
    );
  };


  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-50">Admin Access Management</h2>
        <p className="mt-1 text-sm text-zinc-400">Register and manage admin accounts for the academy</p>
      </div>

      {submitting && <LoadingSpinner overlay />}

      {/* Create Admin Form - Always visible */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-zinc-50">Register New Admin</h3>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            {success}
          </div>
        )}

        {generatedPassword && showPassword && (
          <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-200 mb-2">Temporary Password Generated:</p>
                <p className="font-mono text-lg text-cyan-100 break-all">{generatedPassword}</p>
                <p className="text-xs text-cyan-300 mt-2">⚠️ Please copy this password and share it securely with the new admin. They will need to change it on first login.</p>
              </div>
              <button
                onClick={() => setShowPassword(false)}
                className="text-cyan-400 hover:text-cyan-300"
              >
                <EyeOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="John"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              placeholder="admin@example.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Position in Academy
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="e.g., Director, Instructor, Coordinator"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Level of Access <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.accessLevel}
                onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {ACCESS_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              placeholder="+1234567890"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Country"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="City"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Temporary Password
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 pr-10 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Leave empty to auto-generate"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Generate
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Leave empty to auto-generate a secure password</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Additional notes about this admin..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating Admin...' : 'Create Admin Account'}
          </button>
        </form>
      </div>

      {/* Admins List - Only show loading for the list, not the form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-zinc-50">Registered Admins ({admins.length})</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <div className="ml-4 text-sm text-zinc-400">Loading admins...</div>
          </div>
        ) : admins.length === 0 ? (
          <div className="py-8 text-center text-zinc-400">No admins registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Access Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-400">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">{admin.fullName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <Briefcase className="h-4 w-4 text-zinc-500" />
                        {admin.position}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getAccessLevelBadge(admin.accessLevel)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs text-zinc-400">
                        {admin.phone !== 'Not provided' && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {admin.phone}
                          </div>
                        )}
                        {(admin.country !== 'Not provided' || admin.city !== 'Not provided') && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[admin.city, admin.country].filter(Boolean).join(', ') || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {admin.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                            <XCircle className="h-3 w-3" />
                            Unverified
                          </span>
                        )}
                        {admin.requiresPasswordChange && (
                          <span className="text-xs text-orange-400">Password change required</span>
                        )}
                        {admin.isLocked && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(admin.id, admin.fullName)}
                          className="rounded p-1.5 text-red-400 transition hover:bg-red-500/10"
                          title="Delete admin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

