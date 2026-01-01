import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail, sanitizeName, sanitizeTextContent } from '@/lib/validation';
import { requireStudent } from '@/lib/session';

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

    // Validate and normalize email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }

    // Optional: If user is logged in, verify email matches their session
    const session = requireStudent(req);
    if (session) {
      const sessionEmail = session.email.toLowerCase().trim();
      if (sessionEmail !== emailValidation.normalized) {
        return NextResponse.json(
          { error: 'If you are logged in, you must use your account email address.' },
          { status: 403 }
        );
      }
    }

    // Sanitize inputs
    const sanitizedName = sanitizeName(name, 100);
    if (!sanitizedName || sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters and contain only letters' },
        { status: 400 }
      );
    }

    const sanitizedCountry = country ? String(country).substring(0, 100) : null;
    const sanitizedWhatsapp = whatsapp ? String(whatsapp).replace(/[^\d\s\-\(\)\+]/g, '').trim().substring(0, 20) : null;
    const sanitizedRole = role ? sanitizeTextContent(role, 100) : null;
    const sanitizedExperience = experience ? sanitizeTextContent(experience, 1000) : null;
    const sanitizedTeachingExperience = teachingExperience ? sanitizeTextContent(teachingExperience, 1000) : null;
    const sanitizedMotivation = motivation ? sanitizeTextContent(motivation, 2000) : null;
    const sanitizedComments = comments ? sanitizeTextContent(comments, 2000) : null;
    const sanitizedHours = hours ? String(hours).substring(0, 50) : null;

    const { error } = await supabaseAdmin.from('mentorship_applications').insert({
      name: sanitizedName,
      email: emailValidation.normalized,
      country: sanitizedCountry,
      whatsapp: sanitizedWhatsapp,
      role: sanitizedRole,
      experience: sanitizedExperience,
      teaching_experience: sanitizedTeachingExperience,
      motivation: sanitizedMotivation,
      hours: sanitizedHours,
      comments: sanitizedComments,
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









