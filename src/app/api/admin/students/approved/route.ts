import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students/approved
 * Get all approved and pending students (from applications with status='Approved' or 'Pending')
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get approved AND pending students from applications
    const BATCH_SIZE = 1000;
    
    // Get approved applications
    const { data: approvedApplications, error: approvedAppsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false });

    if (approvedAppsError) {
      console.error('[Approved Students API] Error fetching approved applications:', approvedAppsError);
    }

    // Get pending applications
    const { data: pendingApplications, error: pendingAppsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (pendingAppsError) {
      console.error('[Approved Students API] Error fetching pending applications:', pendingAppsError);
    }

    // Combine all applications (approved + pending)
    const allApplications = [
      ...(approvedApplications || []),
      ...(pendingApplications || [])
    ];

    if (allApplications.length === 0) {
      return NextResponse.json(
        {
          students: [],
          total: 0,
        },
        { status: 200 }
      );
    }

    // Create sets of email addresses with their application status
    const approvedEmails = new Set<string>();
    const pendingEmails = new Set<string>();
    const allEmails = new Set<string>();
    
    if (approvedApplications) {
      approvedApplications.forEach((app) => {
        if (app.email) {
          const emailLower = app.email.toLowerCase();
          approvedEmails.add(emailLower);
          allEmails.add(emailLower);
        }
      });
    }
    
    if (pendingApplications) {
      pendingApplications.forEach((app) => {
        if (app.email) {
          const emailLower = app.email.toLowerCase();
          pendingEmails.add(emailLower);
          allEmails.add(emailLower);
        }
      });
    }

    // Get profiles for all emails (approved + pending)
    const allEmailArray = Array.from(allEmails);
    
    let allProfiles: any[] = [];
    
    // Fetch by emails (from approved and pending applications)
    for (let i = 0; i < allEmailArray.length; i += BATCH_SIZE) {
      const batch = allEmailArray.slice(i, i + BATCH_SIZE);
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
          console.error('[Approved Students API] Error fetching profiles by email:', profilesError);
        } else if (profilesBatch) {
          allProfiles.push(...profilesBatch);
        }
      }

    // Get student records for all profiles
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

    // Create applications map for quick lookup (prioritize approved over pending)
    const applicationsMap = new Map<string, any>();
    allApplications.forEach((app) => {
      const emailLower = app.email?.toLowerCase();
      if (emailLower) {
        const existing = applicationsMap.get(emailLower);
        if (!existing) {
          applicationsMap.set(emailLower, app);
        } else {
          // If multiple applications, prioritize approved over pending, then most recent
          const existingIsApproved = existing.status === 'Approved';
          const currentIsApproved = app.status === 'Approved';
          
          if (currentIsApproved && !existingIsApproved) {
            // Current is approved, existing is not - use current
            applicationsMap.set(emailLower, app);
          } else if (currentIsApproved === existingIsApproved) {
            // Both same status - use most recent
            if (new Date(app.created_at) > new Date(existing.created_at)) {
              applicationsMap.set(emailLower, app);
            }
          }
          // Otherwise keep existing (approved > pending, or existing is more recent)
        }
      }
    });

    // Combine and format the data - include students with approved OR pending applications
    const approvedStudents: any[] = [];

    for (const profile of allProfiles) {
      const emailLower = profile.email?.toLowerCase();
      
      // Include if they have an approved OR pending application
      if (!emailLower || !allEmails.has(emailLower)) {
        continue; // Skip if not in approved/pending emails list
      }
      
      // Determine application status
      const isApproved = approvedEmails.has(emailLower);
      const isPending = pendingEmails.has(emailLower);

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
        applicationStatus: isApproved ? 'Approved' : (isPending ? 'Pending' : 'Unknown'),
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

