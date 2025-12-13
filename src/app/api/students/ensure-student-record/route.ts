import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Ensure a student record exists for a given profile
 * This is useful when checking if someone should have a student record
 * and creating it if it doesn't exist
 */
export async function POST(req: NextRequest) {
  try {
    const { profileId, email } = await req.json();

    // Validate input
    if (!profileId && !email) {
      return NextResponse.json(
        { error: 'Either profileId or email is required' },
        { status: 400 }
      );
    }

    let profileIdToUse = profileId;

    // If email provided, get profile ID
    if (!profileIdToUse && email) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }

      profileIdToUse = profile.id;
    }

    // Check if student record exists
    const { data: existingStudent, error: studentCheckError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('profile_id', profileIdToUse)
      .maybeSingle();

    if (existingStudent) {
      // Student record already exists
      return NextResponse.json(
        {
          success: true,
          message: 'Student record already exists',
          student: existingStudent,
          created: false,
        },
        { status: 200 }
      );
    }

    // Create student record
    const { data: newStudent, error: studentCreateError } = await supabaseAdmin
      .from('students')
      .insert({
        profile_id: profileIdToUse,
        progress_percent: 0,
        assignments_completed: 0,
        projects_completed: 0,
        live_sessions_attended: 0,
      })
      .select('*')
      .single();

    if (studentCreateError) {
      console.error('Error creating student record:', studentCreateError);
      return NextResponse.json(
        { error: 'Failed to create student record', details: studentCreateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student record created successfully',
        student: newStudent,
        created: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in ensure-student-record API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}






