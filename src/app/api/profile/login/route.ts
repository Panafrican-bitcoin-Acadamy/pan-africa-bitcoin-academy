import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Look up profile by email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !profiles) {
      return NextResponse.json(
        { found: false, profile: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        found: true,
        profile: {
          id: profiles.id,
          name: profiles.name,
          email: profiles.email,
          phone: profiles.phone,
          country: profiles.country,
          city: profiles.city,
          studentId: profiles.student_id,
          status: profiles.status,
          photoUrl: profiles.photo_url,
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

