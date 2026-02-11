import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students/approved
 * Get all approved students (from applications with status='Approved' and from students/profiles)
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get approved applications
    const { data: approvedApplications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('[Approved Students API] Error fetching approved applications:', appsError);
    }

    // Get all students (from students table, which are approved/enrolled)
    const { data: students, error: studentsError } = await supabaseAdmin
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
      return NextResponse.json(
        {
          error: 'Failed to fetch approved students',
          ...(process.env.NODE_ENV === 'development' ? { details: studentsError.message } : {}),
        },
        { status: 500 }
      );
    }

    // Combine and format the data
    const approvedStudents: any[] = [];

    // Add students from students table (these are enrolled/approved)
    if (students) {
      for (const student of students) {
        const profile = student.profiles;
        if (profile) {
          // Handle cohorts - it might be an array or a single object
          const cohortData = profile.cohorts;
          const cohort = Array.isArray(cohortData) ? cohortData[0] : cohortData;
          
          approvedStudents.push({
            id: profile.id,
            studentId: profile.student_id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            country: profile.country,
            city: profile.city,
            status: profile.status || 'Active',
            cohortId: profile.cohort_id,
            cohortName: cohort?.name || null,
            cohort: cohort,
            progressPercent: student.progress_percent || 0,
            assignmentsCompleted: student.assignments_completed || 0,
            projectsCompleted: student.projects_completed || 0,
            liveSessionsAttended: student.live_sessions_attended || 0,
            examScore: student.exam_score || null,
            examCompletedAt: student.exam_completed_at || null,
            createdAt: profile.created_at,
            source: 'students_table',
          });
        }
      }
    }

    // Add approved applications that might not have student records yet
    if (approvedApplications) {
      for (const app of approvedApplications) {
        // Check if this application already has a student record
        const hasStudentRecord = approvedStudents.some(
          (s) => s.email?.toLowerCase() === app.email?.toLowerCase()
        );

        if (!hasStudentRecord) {
          // Try to find profile by email
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select(`
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
            `)
            .eq('email', app.email)
            .maybeSingle();

          // Handle cohorts - it might be an array or a single object
          const cohortData = profile?.cohorts;
          const cohort = Array.isArray(cohortData) ? cohortData[0] : cohortData;
          
          approvedStudents.push({
            id: profile?.id || app.id,
            studentId: profile?.student_id || null,
            name: `${app.first_name} ${app.last_name}`,
            email: app.email,
            phone: app.phone || profile?.phone,
            country: app.country || profile?.country,
            city: app.city || profile?.city,
            status: profile?.status || 'Approved',
            cohortId: app.preferred_cohort_id || profile?.cohort_id,
            cohortName: cohort?.name || null,
            cohort: cohort,
            progressPercent: 0,
            assignmentsCompleted: 0,
            projectsCompleted: 0,
            liveSessionsAttended: 0,
            examScore: null,
            examCompletedAt: null,
            createdAt: app.created_at,
            source: 'application',
            applicationId: app.id,
          });
        }
      }
    }

    // Sort by creation date (most recent first)
    approvedStudents.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(
      {
        students: approvedStudents,
        total: approvedStudents.length,
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

