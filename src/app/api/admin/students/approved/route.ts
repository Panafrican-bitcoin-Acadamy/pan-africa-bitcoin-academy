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

    // Get approved applications FIRST (this is the source of truth for approved status)
    const { data: approvedApplications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('[Approved Students API] Error fetching approved applications:', appsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch approved applications',
          ...(process.env.NODE_ENV === 'development' ? { details: appsError.message } : {}),
        },
        { status: 500 }
      );
    }

    // Create a set of approved email addresses (source of truth)
    const approvedEmails = new Set<string>();
    if (approvedApplications) {
      approvedApplications.forEach((app) => {
        if (app.email) {
          approvedEmails.add(app.email.toLowerCase());
        }
      });
    }

    // Only get students whose emails match approved applications
    // This ensures we only show students who are actually approved
    const approvedEmailArray = Array.from(approvedEmails);
    
    if (approvedEmailArray.length === 0) {
      return NextResponse.json(
        {
          students: [],
          total: 0,
        },
        { status: 200 }
      );
    }

    // Get profiles for approved emails
    const BATCH_SIZE = 1000;
    let allProfiles: any[] = [];
    
    for (let i = 0; i < approvedEmailArray.length; i += BATCH_SIZE) {
      const batch = approvedEmailArray.slice(i, i + BATCH_SIZE);
      const { data: profilesBatch, error: profilesError } = await supabaseAdmin
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
        .in('email', batch);

      if (profilesError) {
        console.error('[Approved Students API] Error fetching profiles batch:', profilesError);
      } else if (profilesBatch) {
        allProfiles.push(...profilesBatch);
      }
    }

    // Get student records for these profiles
    const profileIds = allProfiles.map((p) => p.id).filter(Boolean);
    let studentsMap = new Map<string, any>();
    
    if (profileIds.length > 0) {
      for (let i = 0; i < profileIds.length; i += BATCH_SIZE) {
        const batch = profileIds.slice(i, i + BATCH_SIZE);
        const { data: studentsBatch, error: studentsError } = await supabaseAdmin
          .from('students')
          .select('*')
          .in('profile_id', batch);

        if (studentsError) {
          console.error('[Approved Students API] Error fetching students batch:', studentsError);
        } else if (studentsBatch) {
          studentsBatch.forEach((student: any) => {
            studentsMap.set(student.profile_id, student);
          });
        }
      }
    }

    // Create applications map for quick lookup
    const applicationsMap = new Map<string, any>();
    if (approvedApplications) {
      approvedApplications.forEach((app) => {
        const emailLower = app.email?.toLowerCase();
        if (emailLower) {
          // If multiple applications, keep the most recent one
          const existing = applicationsMap.get(emailLower);
          if (!existing || new Date(app.created_at) > new Date(existing.created_at)) {
            applicationsMap.set(emailLower, app);
          }
        }
      });
    }

    // Combine and format the data - ONLY include students with approved applications
    const approvedStudents: any[] = [];

    for (const profile of allProfiles) {
      const emailLower = profile.email?.toLowerCase();
      if (!emailLower || !approvedEmails.has(emailLower)) {
        continue; // Skip if not in approved emails list
      }

      const student = studentsMap.get(profile.id);
      const application = applicationsMap.get(emailLower);

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
        progressPercent: student?.progress_percent || 0,
        assignmentsCompleted: student?.assignments_completed || 0,
        projectsCompleted: student?.projects_completed || 0,
        liveSessionsAttended: student?.live_sessions_attended || 0,
        examScore: student?.exam_score || null,
        examCompletedAt: student?.exam_completed_at || null,
        createdAt: application?.created_at || profile.created_at,
        source: student ? 'students_table' : 'application',
        applicationId: application?.id || null,
      });
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

