'use client';

import { useState, useEffect } from 'react';
import { useSession } from './useSession';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';

interface Profile {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  photoUrl?: string;
  phone?: string;
  country?: string;
  city?: string;
  status?: string;
}

export function useAuth() {
  const { isAuthenticated, email, loading: sessionLoading, showSessionExpired, setShowSessionExpired, logout } = useSession('student');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile data when authenticated
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated && email) {
        try {
          const res = await fetch('/api/profile/user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setProfile({
                id: data.profile.id,
                name: data.profile.name,
                email: data.profile.email,
                photoUrl: data.profile.photoUrl,
                phone: data.profile.phone,
                country: data.profile.country,
                city: data.profile.city,
                status: data.profile.status,
              });
              setIsRegistered(!!data.isRegistered);
            } else {
              setProfile(null);
              setIsRegistered(false);
            }
          } else {
            setProfile(null);
            setIsRegistered(false);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setProfile(null);
          setIsRegistered(false);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setIsRegistered(false);
        setLoading(sessionLoading);
      }
    };

    fetchProfile();
  }, [isAuthenticated, email, sessionLoading]);

  return {
    isAuthenticated,
    profile,
    isRegistered,
    loading,
    showSessionExpired,
    setShowSessionExpired,
    logout,
  };
}
