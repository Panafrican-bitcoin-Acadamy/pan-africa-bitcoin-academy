import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      country,
      whatsapp,
      role,
      experience,
      teachingExperience,
      motivation,
      hours,
      comments,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('mentorship_applications').insert({
      name,
      email,
      country: country || null,
      whatsapp: whatsapp || null,
      role: role || null,
      experience: experience || null,
      teaching_experience: teachingExperience || null,
      motivation: motivation || null,
      hours: hours || null,
      comments: comments || null,
      status: 'Pending',
    });

    if (error) {
      console.error('Mentorship apply error:', error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mentorship apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}









