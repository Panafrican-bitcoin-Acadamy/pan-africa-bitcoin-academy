import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Session verification endpoint
 * Verifies that a user's email corresponds to an existing profile
 * Used for checking authentication state without requiring password
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', valid: false },
        { status: 400 }
      );
    }

    // Look up profile by email (without password verification)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, country, city, status, photo_url')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Session verification failed', valid: false },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { valid: false, profile: null },
        { status: 200 }
      );
    }

    // Profile exists - return profile data
    return NextResponse.json(
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
  } catch (error: any) {
    console.error('Error in session verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}

