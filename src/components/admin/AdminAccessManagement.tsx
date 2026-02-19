'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Mail, Phone, MapPin, Briefcase, Shield, CheckCircle2, XCircle, Lock, Eye, EyeOff, User } from 'lucide-react';
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
    <div className="space-y-6" data-testid="admin-access-management">
      {/* Debug: Always visible test */}
      <div className="rounded-lg border-2 border-green-500 bg-green-500/10 p-4 mb-4">
        <p className="text-green-300 font-semibold">✓ AdminAccessManagement Component is Rendering</p>
        <p className="text-green-400/70 text-xs mt-1">Loading: {loading ? 'Yes' : 'No'} | Admins: {admins.length}</p>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <UserPlus className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-50">Admin Access Management</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Register and manage admin accounts for the academy</p>
        </div>
      </div>

      {submitting && <LoadingSpinner overlay />}

      {/* Create Admin Form - Always visible */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-3 pb-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <UserPlus className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-50">Register New Admin User</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Fill in the details below to create a new admin account</p>
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/50">
              <User className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-zinc-300">Personal Information</h4>
            </div>
            
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
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                  placeholder="Enter first name"
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
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </div>

          {/* Role & Access Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/50">
              <Briefcase className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-zinc-300">Role & Access</h4>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Position in Academy
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                    placeholder="e.g., Director, Instructor, Coordinator"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Level of Access <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none z-10" />
                  <select
                    required
                    value={formData.accessLevel}
                    onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-3 py-2.5 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition appearance-none cursor-pointer"
                  >
                    {ACCESS_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/50">
              <Phone className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-zinc-300">Contact Information</h4>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Country
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                    placeholder="Enter country"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                    placeholder="Enter city"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Additional Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/50">
              <Lock className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-zinc-300">Security & Additional Information</h4>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.temporaryPassword}
                    onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
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
                  className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">Leave empty to auto-generate a secure 16-character password</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition resize-none"
                placeholder="Additional notes about this admin (e.g., responsibilities, special permissions, etc.)"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating Admin Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Admin Account</span>
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-center text-zinc-500">
              Required fields are marked with <span className="text-red-400">*</span>
            </p>
          </div>
        </form>
      </div>

      {/* Admins List - Only show loading for the list, not the form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Shield className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-50">Registered Admins</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''} registered</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" />
            <div className="ml-4 text-sm text-zinc-400">Loading admins...</div>
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50 mb-4">
              <Shield className="h-8 w-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 font-medium">No admins registered yet</p>
            <p className="text-xs text-zinc-500 mt-1">Use the form above to register the first admin</p>
          </div>
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

