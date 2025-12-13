import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireStudent, attachSessionRefresh } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = requireStudent(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Fetch full profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, country, city, status, photo_url')
    .eq('id', session.userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const res = NextResponse.json({ 
    profile: { 
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      city: profile.city,
      status: profile.status,
      photoUrl: profile.photo_url,
    } 
  });
  
  // Attach refreshed session
  attachSessionRefresh(res, {
    userId: session.userId,
    email: session.email,
    userType: 'student',
    issuedAt: session.issuedAt,
    lastActive: Date.now(),
  });
  
  return res;
}

    userType: 'student',
    issuedAt: session.issuedAt,
    lastActive: Date.now(),
  });
  
  return res;
}
