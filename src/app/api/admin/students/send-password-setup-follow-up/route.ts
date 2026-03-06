import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { sendPasswordSetupFollowUpEmail } from '@/lib/email';

/**
 * POST /api/admin/students/send-password-setup-follow-up
 *
 * Sends the "disregard the first email, use this link to set up your password" email
 * (dark-theme template with Set Up Your Password button and link).
 * Requires admin authentication.
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = emailValidation.normalized;

    // Fetch profile with cohort name (profiles may have cohort_id; cohort from students or applications)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, cohort_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          emailFound: false,
          message: 'No student account found with this email address.',
        },
        { status: 200 }
      );
    }

    let cohortName: string | undefined;
    if (profile.cohort_id) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('name')
        .eq('id', profile.cohort_id)
        .maybeSingle();
      cohortName = cohort?.name ?? undefined;
    }

    const emailResult = await sendPasswordSetupFollowUpEmail({
      studentName: profile.name || 'Student',
      studentEmail: profile.email,
      cohortName,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Follow-up email sent. Student can use the link in that email to set up their password.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error in send-password-setup-follow-up API:', error?.message);
    return NextResponse.json(
      { error: 'Failed to send follow-up email' },
      { status: 500 }
    );
  }
}
