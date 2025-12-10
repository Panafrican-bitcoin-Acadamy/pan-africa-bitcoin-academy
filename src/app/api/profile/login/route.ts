import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Look up profile by email (including password_hash for verification)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Authentication failed', found: false },
        { status: 500 }
      );
    }

    if (!profile) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { error: 'Invalid email or password', found: false },
        { status: 401 }
      );
    }

    // Verify password
    if (!profile.password_hash) {
      // Profile exists but no password set (legacy account)
      return NextResponse.json(
        { error: 'Please set a password for your account', found: false },
        { status: 401 }
      );
    }

    // Check if it's an old-style hash (for migration)
    const isOldHash = profile.password_hash.startsWith('hashed_');
    let passwordValid = false;

    if (isOldHash) {
      // Legacy hash format - compare directly (for migration purposes)
      passwordValid = profile.password_hash === `hashed_${password}`;
      // If valid, rehash with bcrypt for future logins
      if (passwordValid) {
        const saltRounds = 10;
        const newHash = await bcrypt.hash(password, saltRounds);
        await supabase
          .from('profiles')
          .update({ password_hash: newHash })
          .eq('id', profile.id);
      }
    } else {
      // Modern bcrypt hash
      passwordValid = await bcrypt.compare(password, profile.password_hash);
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password', found: false },
        { status: 401 }
      );
    }

    // Password is valid - return profile (without password_hash)
    return NextResponse.json(
      {
        found: true,
        success: true,
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
    console.error('Error in profile login API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

