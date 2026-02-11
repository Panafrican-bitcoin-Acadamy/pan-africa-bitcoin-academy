import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students/all
 * Get ALL registered students from profiles table
 * This includes everyone who has registered, regardless of application or student status
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL profiles (everyone who has registered)
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        cohorts (
          id,
          name,
          start_date,
          end_date,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('[All Students API] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      );
    }

    // Get all applications to match with profiles
    const { data: allApplications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('[All Students API] Error fetching applications:', appsError);
    }

    // Get all students (from students table) to get progress data
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profiles (
          id
        )
      `)
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('[All Students API] Error fetching students:', studentsError);
    }

    // Create maps for quick lookup
    const studentsMap = new Map<string, any>();
    if (students) {
      for (const student of students) {
        if (student.profiles?.id) {
          studentsMap.set(student.profiles.id, student);
        }
      }
    }

    const applicationsMap = new Map<string, any>();
    if (allApplications) {
      for (const app of allApplications) {
        const emailLower = app.email?.toLowerCase();
        if (emailLower) {
          applicationsMap.set(emailLower, app);
        }
      }
    }

    // Process ALL profiles (everyone who has registered)
    const allStudents: any[] = [];
    
    if (allProfiles) {
      for (const profile of allProfiles) {
        // Handle cohorts - it might be an array or a single object
        const cohortData = profile.cohorts;
        const cohort = Array.isArray(cohortData) ? cohortData[0] : cohortData;
        
        // Get student record if exists
        const studentRecord = studentsMap.get(profile.id);
        
        // Get application record if exists
        const emailLower = profile.email?.toLowerCase();
        const application = emailLower ? applicationsMap.get(emailLower) : null;
        
        // Determine application status
        let applicationStatus = 'Not Applied';
        if (studentRecord) {
          applicationStatus = 'Approved'; // Has student record = approved
        } else if (application) {
          applicationStatus = application.status; // Pending, Approved, or Rejected
        }
        
        allStudents.push({
          id: profile.id,
          studentId: profile.student_id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          status: profile.status || 'New',
          cohortId: profile.cohort_id,
          cohortName: cohort?.name || null,
          cohort: cohort,
          progressPercent: studentRecord?.progress_percent || 0,
          assignmentsCompleted: studentRecord?.assignments_completed || 0,
          projectsCompleted: studentRecord?.projects_completed || 0,
          liveSessionsAttended: studentRecord?.live_sessions_attended || 0,
          examScore: studentRecord?.exam_score || null,
          examCompletedAt: studentRecord?.exam_completed_at || null,
          createdAt: profile.created_at,
          source: studentRecord ? 'students_table' : (application ? 'application' : 'profile_only'),
          applicationId: application?.id || null,
          applicationStatus: applicationStatus,
        });
      }
    }

    // Sort by creation date (most recent first)
    allStudents.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Count by status
    const statusCounts = {
      total: allStudents.length,
      approved: allStudents.filter((s) => s.applicationStatus === 'Approved' || s.source === 'students_table').length,
      pending: allStudents.filter((s) => s.applicationStatus === 'Pending').length,
      rejected: allStudents.filter((s) => s.applicationStatus === 'Rejected').length,
      active: allStudents.filter((s) => s.status === 'Active').length,
    };

    return NextResponse.json(
      {
        students: allStudents,
        total: allStudents.length,
        counts: statusCounts,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[All Students API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

