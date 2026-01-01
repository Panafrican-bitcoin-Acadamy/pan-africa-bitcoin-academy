import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateAndNormalizeEmail, sanitizeName } from '@/lib/validation';
import { requireStudent } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    // Check authentication - user must be logged in
    const session = requireStudent(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { email, ...updateData } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify email matches authenticated session
    const sessionEmail = session.email.toLowerCase().trim();
    if (sessionEmail !== email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only update your own profile.' },
        { status: 403 }
      );
    }

    // Validate and normalize email if being updated
    let normalizedEmail = email.toLowerCase().trim();
    if (updateData.email) {
      const emailValidation = validateAndNormalizeEmail(updateData.email);
      if (!emailValidation.valid || !emailValidation.normalized) {
        return NextResponse.json(
          { error: emailValidation.error || 'Invalid email format' },
          { status: 400 }
        );
      }
      normalizedEmail = emailValidation.normalized;
    }

    // Sanitize name if being updated
    let sanitizedName: string | undefined;
    if (updateData.name) {
      // Extract first and last name if full name
      const nameParts = updateData.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const firstName = sanitizeName(nameParts[0], 50);
        const lastName = sanitizeName(nameParts.slice(1).join(' '), 50);
        sanitizedName = `${firstName} ${lastName}`.trim();
      } else {
        sanitizedName = sanitizeName(updateData.name, 100);
      }
      
      if (!sanitizedName || sanitizedName.length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters and contain only letters' },
          { status: 400 }
        );
      }
    }

    // Sanitize phone
    let sanitizedPhone: string | undefined;
    if (updateData.phone) {
      sanitizedPhone = String(updateData.phone).replace(/[^\d\s\-\(\)\+]/g, '').trim();
      if (sanitizedPhone.length > 20) {
        sanitizedPhone = sanitizedPhone.substring(0, 20);
      }
    }

    // Sanitize country and city
    const sanitizedCountry = updateData.country ? String(updateData.country).substring(0, 100) : undefined;
    const sanitizedCity = updateData.city ? String(updateData.city).substring(0, 100) : undefined;

    // Build update object with only provided and sanitized fields
    const updateObject: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (sanitizedName) updateObject.name = sanitizedName;
    if (sanitizedPhone !== undefined) updateObject.phone = sanitizedPhone || null;
    if (sanitizedCountry !== undefined) updateObject.country = sanitizedCountry || null;
    if (sanitizedCity !== undefined) updateObject.city = sanitizedCity || null;
    if (updateData.photoUrl) updateObject.photo_url = String(updateData.photoUrl).substring(0, 500);
    if (normalizedEmail !== email.toLowerCase().trim()) updateObject.email = normalizedEmail;

    // Update profile - use session userId for security
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateObject)
      .eq('id', session.userId)
      .eq('email', sessionEmail)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update profile',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
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
    console.error('Error in profile update API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

