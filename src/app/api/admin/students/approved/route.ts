import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students/approved
 * Get all enrolled students from the students table
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, let's check if there are any students in the table
    const { count: studentsCount } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    console.log(`[Approved Students API] Total students in database: ${studentsCount || 0}`);

    // Fetch all enrolled students with their profiles using a join query
    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        profile_id,
        progress_percent,
        assignments_completed,
        projects_completed,
        live_sessions_attended,
        exam_score,
        exam_completed_at,
        created_at,
        updated_at,
        profiles (
          id,
          name,
          email,
          phone,
          country,
          city,
          status,
          cohort_id,
          student_id,
          created_at,
          cohorts (
            id,
            name,
            start_date,
            end_date,
            status
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('[Approved Students API] Error fetching students:', studentsError);
      console.error('[Approved Students API] Error details:', JSON.stringify(studentsError, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to fetch students',
          ...(process.env.NODE_ENV === 'development' ? { details: studentsError.message, code: studentsError.code } : {}),
        },
        { status: 500 }
      );
    }

    console.log(`[Approved Students API] Fetched ${studentsData?.length || 0} students from database`);

    if (!studentsData || studentsData.length === 0) {
      console.log('[Approved Students API] No students found in students table');
      return NextResponse.json(
        {
          students: [],
          total: 0,
        },
        { status: 200 }
      );
    }

    // Get emails for applications lookup
    const emails = studentsData
      .map((s: any) => {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        return profile?.email?.toLowerCase();
      })
      .filter(Boolean);
    
    let applicationsMap = new Map<string, any>();
    
    if (emails.length > 0) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        const { data: appsBatch } = await supabaseAdmin
          .from('applications')
          .select('*')
          .in('email', batch);

        if (appsBatch) {
          appsBatch.forEach((app: any) => {
            const emailLower = app.email?.toLowerCase();
            if (emailLower) {
              const existing = applicationsMap.get(emailLower);
              if (!existing || new Date(app.created_at) > new Date(existing.created_at)) {
                applicationsMap.set(emailLower, app);
              }
            }
          });
        }
      }
    }

    // Format the data
    const enrolledStudents: any[] = [];
    let skippedCount = 0;

    for (const student of studentsData) {
      // Handle profiles - it might be an array or a single object
      const profileData = student.profiles;
      const profile = Array.isArray(profileData) ? profileData[0] : profileData;
      
      if (!profile) {
        console.warn(`[Approved Students API] Student ${student.id || student.profile_id} has no profile`);
        skippedCount++;
        continue; // Skip if no profile found
      }

      const application = applicationsMap.get(profile.email?.toLowerCase());

      // Handle cohorts - it might be an array or a single object
      const cohortData = profile.cohorts;
      const cohort = Array.isArray(cohortData) ? cohortData[0] : cohortData;
      
      enrolledStudents.push({
        id: profile.id,
        studentId: profile.student_id || student.profile_id || student.id,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        city: profile.city || '',
        status: profile.status || 'Enrolled',
        cohortId: profile.cohort_id || null,
        cohortName: cohort?.name || null,
        cohort: cohort,
        progressPercent: student.progress_percent || 0,
        assignmentsCompleted: student.assignments_completed || 0,
        projectsCompleted: student.projects_completed || 0,
        liveSessionsAttended: student.live_sessions_attended || 0,
        examScore: student.exam_score || null,
        examCompletedAt: student.exam_completed_at || null,
        createdAt: student.created_at || profile.created_at || application?.created_at,
        source: 'students_table',
        applicationId: application?.id || null,
        applicationStatus: application?.status || 'Approved',
      });
    }

    console.log(`[Approved Students API] Processed ${enrolledStudents.length} students, skipped ${skippedCount} without profiles`);


    // Sort by creation date (most recent first)
    enrolledStudents.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(
      {
        students: enrolledStudents,
        total: enrolledStudents.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Approved Students API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

