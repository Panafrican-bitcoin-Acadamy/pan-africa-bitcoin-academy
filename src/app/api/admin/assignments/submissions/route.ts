import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/assignments/submissions
 * Fetch all assignment submissions for admin review
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status'); // 'submitted' (queue), 'graded' (decided), 'all'
    const assignmentId = searchParams.get('assignmentId');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Build query for submissions
    let query = supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignments (
          id,
          title,
          description,
          question,
          chapter_number,
          chapter_slug,
          reward_sats
        ),
        profiles:student_id (
          id,
          name,
          email,
          cohort_id
        )
      `)
      .order('submitted_at', { ascending: false });

    // Filter by status if provided (alias: submitted = awaiting review; graded = decided)
    if (status && status !== 'all') {
      if (status === 'submitted') {
        query = query.in('status', ['submitted', 'pending_review']);
      } else if (status === 'graded') {
        query = query.in('status', ['graded', 'approved', 'rejected', 'returned']);
      } else {
        query = query.eq('status', status);
      }
    }

    // Filter by assignment if provided
    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    const list = submissions || [];
    const cohortIds = [
      ...new Set(
        list
          .map((s: { profiles?: { cohort_id?: string | null } | null }) => s.profiles?.cohort_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    let cohortNameById = new Map<string, string>();
    if (cohortIds.length > 0) {
      const { data: cohortRows } = await supabaseAdmin
        .from('cohorts')
        .select('id, name')
        .in('id', cohortIds);
      cohortNameById = new Map(
        (cohortRows || []).map((c: { id: string; name: string }) => [c.id, c.name])
      );
    }

    const submissionsWithCohort = list.map(
      (s: {
        profiles?: { cohort_id?: string | null; cohort_name?: string | null } | null;
        [key: string]: unknown;
      }) => {
        const cid = s.profiles?.cohort_id;
        const cohortName = cid ? cohortNameById.get(cid) ?? null : null;
        return {
          ...s,
          profiles: s.profiles
            ? { ...s.profiles, cohort_name: cohortName }
            : s.profiles,
        };
      }
    );

    return NextResponse.json({ submissions: submissionsWithCohort });
  } catch (err: any) {
    console.error('Error in GET /api/admin/assignments/submissions:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

