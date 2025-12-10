import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get optional email filter from query params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Build the query
    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        profiles (
          id,
          name,
          email,
          phone,
          country,
          city,
          status,
          photo_url
        )
      `);

    // Filter by email if provided
    if (email) {
      // First, get the profile ID for this email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        // User doesn't have a profile or isn't a student yet - return empty array
        return NextResponse.json({ students: [] }, { status: 200 });
      }

      // Filter students by profile_id
      query = query.eq('profile_id', profile.id);
    }

    const { data: students, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      // Don't fail if it's just "no rows returned" - return empty array
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json({ students: [] }, { status: 200 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch students', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const transformedStudents = (students || []).map((student: any) => {
      const profile = student.profiles || {};
      return {
        id: student.id,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        city: profile.city || '',
        status: profile.status || 'New',
        studentId: student.id || '', // Use student.id as studentId if needed
        progress: student.progress_percent || 0,
        assignmentsCompleted: student.assignments_completed || 0,
        projectsCompleted: student.projects_completed || 0,
        liveSessions: student.live_sessions_attended || 0,
        photoUrl: profile.photo_url || null,
      };
    });

    return NextResponse.json({ students: transformedStudents }, { status: 200 });
  } catch (error: any) {
    console.error('Error in students API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

