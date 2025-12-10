'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Upload } from 'lucide-react';
import Link from 'next/link';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  profileData: any | null;
  profileLoading: boolean;
  profileError: string | null;
  profileImage: string | null;
  onProfileUpdate: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  profileData,
  profileLoading,
  profileError,
  profileImage,
  onProfileUpdate,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
  });
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
  });
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(profileImage);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(profileImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (profileData) {
      const initialData = {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        country: profileData.country || '',
        city: profileData.city || '',
      };
      setEditFormData(initialData);
      setOriginalData(initialData);
      setCurrentProfileImage(profileData.photoUrl || null);
      setOriginalProfileImage(profileData.photoUrl || null);
    }
  }, [profileData]);

  useEffect(() => {
    // Check if user is registered as student
    const checkStudentStatus = async () => {
      if (!userEmail) return;
      try {
        const res = await fetch('/api/profile/check-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsRegistered(data.isStudent || false);
        }
      } catch (err) {
        // Ignore errors
      }
    };
    if (isOpen) {
      checkStudentStatus();
    }
  }, [isOpen, userEmail]);

  const hasFormChanges =
    editFormData.name !== originalData.name ||
    editFormData.email !== originalData.email ||
    editFormData.phone !== originalData.phone ||
    editFormData.country !== originalData.country ||
    editFormData.city !== originalData.city;

  const hasImageChanges = currentProfileImage !== originalProfileImage;
  const hasChanges = hasFormChanges || hasImageChanges;

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        
        try {
          const res = await fetch('/api/profile/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              imageData: result,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentProfileImage(data.photoUrl);
            // Update the profile data with the new photo URL
            if (profileData) {
              profileData.photoUrl = data.photoUrl;
            }
          } else {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }
        } catch (err: any) {
          console.error('Error uploading image:', err);
          alert(err.message || 'Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
      console.error('Error reading file:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { email, ...otherData } = editFormData;
      const updatePayload: any = {
        email: userEmail,
        ...otherData,
      };

      // Include photoUrl if we have a URL (from upload) or if it's already a URL
      if (currentProfileImage) {
        if (currentProfileImage.startsWith('http')) {
          updatePayload.photoUrl = currentProfileImage;
        } else if (currentProfileImage.startsWith('data:')) {
          // If it's a base64 image that hasn't been uploaded yet, upload it first
          try {
            const uploadRes = await fetch('/api/profile/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userEmail,
                imageData: currentProfileImage,
              }),
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              updatePayload.photoUrl = uploadData.photoUrl;
            }
          } catch (uploadErr) {
            console.error('Error uploading image during save:', uploadErr);
          }
        }
      }

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await res.json();
      setOriginalData(editFormData);
      setOriginalProfileImage(currentProfileImage);
      setIsEditing(false);
      // Call onProfileUpdate to refresh the navbar
      onProfileUpdate();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const initials = profileData?.name
    ? profileData.name
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-zinc-50">Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : profileError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {profileError}
          </div>
        ) : profileData ? (
          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {currentProfileImage ? (
                  <img
                    src={currentProfileImage}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-cyan-500/50"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-orange-500 text-lg font-bold text-black">
                    {initials}
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-cyan-500 text-xs text-black hover:bg-cyan-400">
                  <Upload className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <div>
                <div className="text-base font-semibold text-zinc-100">{profileData.name || 'User'}</div>
                <div className="text-sm text-zinc-400">{profileData.email || ''}</div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold text-zinc-50">Profile Information</div>
                <button
                  onClick={() => {
                    if (isEditing) {
                      setEditFormData(originalData);
                      setCurrentProfileImage(originalProfileImage);
                    }
                    setIsEditing(!isEditing);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Country</label>
                    <input
                      type="text"
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div><span className="text-zinc-400">Name:</span> <span className="text-zinc-100">{profileData.name || '—'}</span></div>
                  <div><span className="text-zinc-400">Email:</span> <span className="text-zinc-100">{profileData.email || '—'}</span></div>
                  <div><span className="text-zinc-400">Phone:</span> <span className="text-zinc-100">{profileData.phone || '—'}</span></div>
                  <div><span className="text-zinc-400">Country:</span> <span className="text-zinc-100">{profileData.country || '—'}</span></div>
                  <div><span className="text-zinc-400">City:</span> <span className="text-zinc-100">{profileData.city || '—'}</span></div>
                </div>
              )}

              {!isRegistered && (
                <div className="mt-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-200">
                  You're not enrolled as a student yet. Apply to join a cohort!
                </div>
              )}
            </div>

            {/* Save Changes Button */}
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}

            {!isRegistered && (
              <Link
                href="/apply"
                onClick={onClose}
                className="block w-full text-center rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200 transition hover:border-orange-500/70 hover:bg-orange-500/20"
              >
                Apply Now
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            No profile data available.
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

