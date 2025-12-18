import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Fetch active enrolled students who can be sponsored
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        profile_id,
        name,
        country,
        city,
        status,
        progress_percent
      `)
      .eq('status', 'Enrolled')
      .order('created_at', { ascending: false })
      .limit(20); // Limit to recent students

    if (error) {
      console.error('Error fetching students for sponsorship:', error);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // Fetch profile photos
    const profileIds = (students || []).map(s => s.profile_id).filter(Boolean);
    let profilePhotos: Record<string, string> = {};
    
    if (profileIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, photo_url')
        .in('id', profileIds);
      
      if (profiles) {
        profilePhotos = Object.fromEntries(
          profiles.map(p => [p.id, p.photo_url || ''])
        );
      }
    }

    // Combine student data with profile photos
    const formattedStudents = (students || []).map((student: any) => ({
      id: student.profile_id || student.id,
      name: student.name || 'Student',
      country: student.country || null,
      city: student.city || null,
      photo_url: profilePhotos[student.profile_id] || null,
      progress_percent: student.progress_percent || 0,
      status: student.status || 'Enrolled',
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error: any) {
    console.error('Error in sponsor students API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
