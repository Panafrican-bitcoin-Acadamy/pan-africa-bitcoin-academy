import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { sendApprovalEmail } from '@/lib/email';

/**
 * POST /api/admin/email/send-approved
 * Send approval emails to all approved students who haven't received one yet
 * Admin only endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all approved applications
    const { data: approvedApplications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('id, email, first_name, last_name, preferred_cohort_id, status')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching approved applications:', appsError);
      return NextResponse.json(
        { error: 'Failed to fetch approved applications' },
        { status: 500 }
      );
    }

    if (!approvedApplications || approvedApplications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No approved applications found',
        sent: 0,
        failed: 0,
        results: [],
      });
    }

    // Get all cohorts for cohort name lookup
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('id, name');

    const cohortMap = new Map(
      (cohorts || []).map((c) => [c.id, c.name])
    );

    const results: Array<{
      email: string;
      name: string;
      success: boolean;
      error?: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;

    // Send emails to each approved student
    for (const app of approvedApplications) {
      const studentName = `${app.first_name} ${app.last_name}`.trim();
      const studentEmail = app.email;
      const cohortName = app.preferred_cohort_id
        ? cohortMap.get(app.preferred_cohort_id)
        : undefined;

      // Check if student has a profile (to determine if password setup is needed)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, password_hash')
        .eq('email', studentEmail.toLowerCase().trim())
        .maybeSingle();

      const needsPasswordSetup = !profile || !profile.password_hash;

      try {
        const emailResult = await sendApprovalEmail({
          studentName,
          studentEmail,
          cohortName,
          needsPasswordSetup,
        });

        if (emailResult.success) {
          sentCount++;
          results.push({
            email: studentEmail,
            name: studentName,
            success: true,
          });
        } else {
          failedCount++;
          results.push({
            email: studentEmail,
            name: studentName,
            success: false,
            error: emailResult.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        failedCount++;
        results.push({
          email: studentEmail,
          name: studentName,
          success: false,
          error: error.message || 'Failed to send email',
        });
      }
    }

    const res = NextResponse.json({
      success: true,
      message: `Email sending completed. ${sentCount} sent, ${failedCount} failed.`,
      sent: sentCount,
      failed: failedCount,
      total: approvedApplications.length,
      results,
    });

    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in send-approved-emails API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/email/send-approved
 * Get count of approved students (for UI display)
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Approved');

    const res = NextResponse.json({
      approvedCount: count || 0,
    });

    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in get-approved-count API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
