import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students/all
 * Get ALL registered students from profiles table
 * This includes everyone who has registered, regardless of application or student status
 * 
 * Query parameters:
 * - limit: Number of records to return (default: 1000, max: 5000)
 * - offset: Number of records to skip (default: 0)
 * - search: Search by name or email
 * - status: Filter by application status (Approved, Pending, Rejected, Not Applied)
 * - cohort_id: Filter by cohort ID
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000', 10), 5000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search')?.trim();
    const statusFilter = searchParams.get('status');
    const cohortId = searchParams.get('cohort_id');

    // Build profiles query with filters
    let profilesQuery = supabaseAdmin
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
      `, { count: 'exact' });

    // Apply filters
    if (cohortId) {
      profilesQuery = profilesQuery.eq('cohort_id', cohortId);
    }
    if (search) {
      profilesQuery = profilesQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    profilesQuery = profilesQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Fetch all data in parallel for better performance
    const [profilesResult, applicationsResult, studentsResult] = await Promise.all([
      profilesQuery,
      supabaseAdmin
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('students')
        .select(`
          *,
          profiles (
            id
          )
        `)
        .order('created_at', { ascending: false })
    ]);

    const { data: allProfiles, error: profilesError, count: totalCount } = profilesResult;
    const { data: allApplications, error: appsError } = applicationsResult;
    const { data: students, error: studentsError } = studentsResult;

    if (profilesError) {
      console.error('[All Students API] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      );
    }

    if (appsError) {
      console.error('[All Students API] Error fetching applications:', appsError);
    }

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

    // Map email to applications - handle multiple applications per email
    // Priority: Approved > Pending > Rejected, then most recent
    const applicationsMap = new Map<string, any>();
    if (allApplications) {
      for (const app of allApplications) {
        const emailLower = app.email?.toLowerCase();
        if (!emailLower) continue;
        
        const existing = applicationsMap.get(emailLower);
        if (!existing) {
          // First application for this email
          applicationsMap.set(emailLower, app);
        } else {
          // Multiple applications - use priority logic
          const statusPriority = { 'Approved': 3, 'Pending': 2, 'Rejected': 1 };
          const existingPriority = statusPriority[existing.status as keyof typeof statusPriority] || 0;
          const newPriority = statusPriority[app.status as keyof typeof statusPriority] || 0;
          
          if (newPriority > existingPriority) {
            // New application has higher priority status
            applicationsMap.set(emailLower, app);
          } else if (newPriority === existingPriority && new Date(app.created_at) > new Date(existing.created_at)) {
            // Same priority, but new application is more recent
            applicationsMap.set(emailLower, app);
          }
          // Otherwise keep existing application
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

    // Apply status filter if provided
    let filteredStudents = allStudents;
    if (statusFilter) {
      filteredStudents = allStudents.filter((s) => s.applicationStatus === statusFilter);
    }

    // Count by status (for current page only)
    // Note: Students with source='students_table' already have applicationStatus='Approved' (line 104)
    const statusCounts = {
      total: totalCount || allStudents.length,
      approved: allStudents.filter((s) => s.applicationStatus === 'Approved').length,
      pending: allStudents.filter((s) => s.applicationStatus === 'Pending').length,
      rejected: allStudents.filter((s) => s.applicationStatus === 'Rejected').length,
      active: allStudents.filter((s) => s.status === 'Active').length,
    };

    return NextResponse.json(
      {
        students: filteredStudents,
        total: totalCount || allStudents.length,
        limit,
        offset,
        hasMore: totalCount ? offset + filteredStudents.length < totalCount : false,
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

