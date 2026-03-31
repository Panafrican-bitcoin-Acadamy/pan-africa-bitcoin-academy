import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/assignments
 * Fetch assignments for a student
 * Returns assignments with submission status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user is an admin (admins have access to all assignments)
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const isAdmin = !!admin;

    // Get student profile (create a dummy profile for admins if they don't have one)
    let profile;
    if (!isAdmin) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, cohort_id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError || !profileData) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      profile = profileData;
    } else {
      // For admins without profiles, use a dummy profile to fetch all assignments
      profile = { id: null, cohort_id: null };
    }

    // Fetch assignments (admins see all, students see their cohort or all cohorts)
    let assignmentsQuery = supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('status', 'active');
    
    if (!isAdmin && profile.cohort_id) {
      assignmentsQuery = assignmentsQuery.or(`cohort_id.is.null,cohort_id.eq.${profile.cohort_id}`);
    }
    // Admins see all assignments regardless of cohort
    
    const { data: assignments, error: assignmentsError } = await assignmentsQuery
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    // De-duplicate assignments that represent the same chapter task.
    // This can happen when both a global assignment (cohort_id null) and
    // a cohort-specific assignment exist for the same chapter/title.
    const dedupedAssignments = (() => {
      const rows = assignments || [];
      const pickByKey = new Map<string, any>();
      const normalize = (v: unknown) => String(v || '').trim().toLowerCase();

      for (const row of rows) {
        const key = `${normalize(row.chapter_slug)}::${normalize(row.title)}`;
        const existing = pickByKey.get(key);
        if (!existing) {
          pickByKey.set(key, row);
          continue;
        }

        // Prefer exact cohort match over global/null assignment.
        const existingIsExactCohort = !!(profile?.cohort_id && existing.cohort_id === profile.cohort_id);
        const rowIsExactCohort = !!(profile?.cohort_id && row.cohort_id === profile.cohort_id);
        if (rowIsExactCohort && !existingIsExactCohort) {
          pickByKey.set(key, row);
          continue;
        }
        if (existingIsExactCohort && !rowIsExactCohort) {
          continue;
        }

        // Otherwise keep the newest record.
        const existingTs = Date.parse(existing.created_at || '') || 0;
        const rowTs = Date.parse(row.created_at || '') || 0;
        if (rowTs > existingTs) {
          pickByKey.set(key, row);
        }
      }

      return Array.from(pickByKey.values());
    })();

    // Fetch student's submissions (skip for admins without profile)
    let submissions = [];
    if (!isAdmin && profile.id) {
      const { data: submissionsData, error: submissionsError } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', profile.id);
      
      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        // Continue without submissions if error
      } else {
        submissions = submissionsData || [];
      }
    }
    
    // For admins with profiles, also fetch their submissions
    if (isAdmin && profile.id) {
      const { data: submissionsData, error: submissionsError } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', profile.id);
      
      if (!submissionsError) {
        submissions = submissionsData || [];
      }
    }

    // Map submissions by assignment_id for quick lookup (skip if no profile)
    const submissionsMap = new Map(
      (submissions || []).map((sub: any) => [sub.assignment_id, sub])
    );

    // Combine assignments with submission status
    const assignmentsWithStatus = dedupedAssignments.map((assignment) => {
      const submission = submissionsMap.get(assignment.id);
      const isOverdue = assignment.due_date
        ? new Date(assignment.due_date) < new Date()
        : false;
      const isSubmitted = !!submission;
      const isCompleted = submission?.is_correct || false;

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        question: assignment.question,
        searchAddress: assignment.search_address,
        chapterNumber: assignment.chapter_number,
        chapterSlug: assignment.chapter_slug,
        points: assignment.points,
        dueDate: assignment.due_date,
        isOverdue,
        status: isCompleted
          ? 'completed'
          : isSubmitted
          ? 'submitted'
          : isOverdue
          ? 'overdue'
          : 'pending',
        submission: submission
          ? {
              id: submission.id,
              answer: submission.answer,
              isCorrect: submission.is_correct,
              pointsEarned: submission.points_earned,
              feedback: submission.feedback,
              submittedAt: submission.submitted_at,
            }
          : null,
        link: assignment.chapter_slug
          ? `/chapters/${assignment.chapter_slug}`
          : '/dashboard',
      };
    });

    return NextResponse.json({
      assignments: assignmentsWithStatus,
      total: assignmentsWithStatus.length,
      completed: assignmentsWithStatus.filter((a) => a.status === 'completed')
        .length,
      pending: assignmentsWithStatus.filter((a) => a.status === 'pending')
        .length,
    });
  } catch (error: any) {
    console.error('Error in assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
