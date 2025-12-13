'use client';

import { useEffect, useState } from 'react';

interface CertificateImageSectionProps {
  profile: {
    email: string;
  };
}

export function CertificateImageSection({ profile }: CertificateImageSectionProps) {
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [loadingCertificateImage, setLoadingCertificateImage] = useState(true);
  const [useAsProfilePicture, setUseAsProfilePicture] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch certificate image on mount
  useEffect(() => {
    const fetchCertificateImage = async () => {
      try {
        const res = await fetch('/api/profile/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile.email }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.student?.certificateImageUrl) {
            setCertificateImage(data.student.certificateImageUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching certificate image:', err);
      } finally {
        setLoadingCertificateImage(false);
      }
    };
    fetchCertificateImage();
  }, [profile.email]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        try {
          const res = await fetch('/api/students/upload-certificate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: result,
              useAsProfilePicture,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setCertificateImage(data.certificateImageUrl);
            alert('Certificate image uploaded successfully!');
            // Reload page to update profile picture if synced
            if (useAsProfilePicture) {
              window.location.reload();
            }
          } else {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }
        } catch (err: any) {
          console.error('Error uploading certificate image:', err);
          alert(err.message || 'Failed to upload certificate image');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      console.error('Error reading file:', err);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove your certificate image?')) return;
    
    try {
      const res = await fetch('/api/students/upload-certificate-image', {
        method: 'DELETE',
      });
      if (res.ok) {
        setCertificateImage(null);
        alert('Certificate image removed successfully!');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove image');
      }
    } catch (err: any) {
      console.error('Error removing certificate image:', err);
      alert(err.message || 'Failed to remove certificate image');
    }
  };

  return (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm">
      <div className="mb-3">
        <div className="font-semibold text-cyan-100 mb-1">Certificate Photo (Optional)</div>
        <p className="text-xs text-cyan-200/70">
          Upload your photo for certificate purposes. If you don't want an image on your certificate, you can leave this empty.
        </p>
      </div>

      {loadingCertificateImage ? (
        <div className="text-center text-xs text-cyan-200/70 py-4">
          Loading...
        </div>
      ) : certificateImage ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={certificateImage}
              alt="Certificate photo"
              className="h-24 w-24 rounded-lg object-cover border-2 border-cyan-500/50"
            />
          </div>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-center text-cyan-200 transition hover:border-cyan-500/70 hover:bg-cyan-500/20">
              Change Photo
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploading}
              />
            </label>
            <button
              onClick={handleRemoveImage}
              className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:border-red-500/70 hover:bg-red-500/20"
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block cursor-pointer rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-4 text-center transition hover:border-cyan-500/70 hover:bg-cyan-500/10">
            <div className="space-y-2">
              <svg className="mx-auto h-8 w-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-xs text-cyan-200">
                {uploading ? 'Uploading...' : 'Click to upload certificate photo'}
              </div>
              <div className="text-xs text-cyan-200/50">
                JPEG, PNG, or WebP (max 5MB)
              </div>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={uploading}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-cyan-200/80 cursor-pointer">
            <input
              type="checkbox"
              checked={useAsProfilePicture}
              onChange={(e) => setUseAsProfilePicture(e.target.checked)}
              className="rounded border-cyan-500/50 bg-cyan-500/10 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Also use this image as my profile picture</span>
          </label>
        </div>
      )}
    </div>
  );
}


