import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, attachSessionRefresh } from '@/lib/session';
import { supabase } from '@/lib/supabase';

/**
 * Session verification endpoint
 * Verifies the session token from cookie and returns profile data
 * Replaces the old email-based verification with secure token-based
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireStudent(req);
    
    if (!session) {
      return NextResponse.json(
        { valid: false, profile: null },
        { status: 200 }
      );
    }

    // Fetch profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, country, city, status, photo_url')
      .eq('id', session.userId)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { valid: false, profile: null },
        { status: 200 }
      );
    }

    const res = NextResponse.json(
      {
        valid: true,
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          status: profile.status,
          photoUrl: profile.photo_url,
        },
      },
      { status: 200 }
    );

    // Refresh session
    attachSessionRefresh(res, {
      userId: session.userId,
      email: session.email,
      userType: 'student',
      issuedAt: session.issuedAt,
      lastActive: Date.now(),
    });

    return res;
  } catch (error: any) {
    console.error('Error in session verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}






