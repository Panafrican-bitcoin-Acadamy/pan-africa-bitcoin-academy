import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { sendRejectionEmail } from '@/lib/email';
import { validateUUID, secureTextInput } from '@/lib/security-utils';
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, rejectedReason, rejectedBy } = await req.json();

    // Security: Validate applicationId format (UUID)
    if (!applicationId || !validateUUID(applicationId)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 }
      );
    }

    // Security: Sanitize rejection reason if provided
    let sanitizedReason = null;
    if (rejectedReason) {
      const reasonValidation = secureTextInput(rejectedReason, { maxLength: 1000 });
      if (reasonValidation.valid && reasonValidation.sanitized) {
        sanitizedReason = reasonValidation.sanitized;
      }
    }

    // Security: Sanitize rejectedBy field if provided
    let sanitizedRejectedBy = session.email; // Default to session email
    if (rejectedBy) {
      const rejectedByValidation = secureTextInput(rejectedBy, { maxLength: 200 });
      if (rejectedByValidation.valid && rejectedByValidation.sanitized) {
        sanitizedRejectedBy = rejectedByValidation.sanitized;
      }
    }

    // Get the application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status === 'Rejected') {
      return NextResponse.json(
        { error: 'Application is already rejected' },
        { status: 400 }
      );
    }

    if (application.status === 'Approved') {
      return NextResponse.json(
        { error: 'Application was already approved and cannot be rejected' },
        { status: 400 }
      );
    }

    // Extract email and name for logging and email sending
    const emailLower = application.email?.toLowerCase().trim();
    const fullName = `${application.first_name || ''} ${application.last_name || ''}`.trim();

    // Security: Log rejection action for audit
    logAdminAction(
      AUDIT_ACTIONS.APPLICATION_REJECTED,
      session.adminId,
      session.email,
      'application',
      {
        resourceId: applicationId,
        details: {
          applicantEmail: emailLower,
          applicantName: fullName,
          rejectionReason: sanitizedReason || 'Not provided',
          rejectedBy: sanitizedRejectedBy,
        },
      }
    );

    // Update application status to Rejected
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'Rejected',
        rejected_reason: sanitizedReason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error rejecting application:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject application', details: updateError.message },
        { status: 500 }
      );
    }

    // Send rejection email to student
    let emailSent = false;
    let emailError = null;
    
    // Validate email before sending
    if (!emailLower || !emailLower.includes('@')) {
      console.warn('Invalid email address, skipping email send:', emailLower);
      emailError = 'Invalid email address format';
    } else if (!fullName || fullName.trim().length === 0) {
      console.warn('Invalid student name, skipping email send:', fullName);
      emailError = 'Student name is missing';
    } else {
      // Send rejection email
      const emailResult = await sendRejectionEmail({
        studentName: fullName,
        studentEmail: emailLower,
        rejectionReason: sanitizedReason || undefined,
      });

      emailSent = emailResult.success;
      emailError = emailResult.error || null;
      
      if (!emailSent) {
        console.error('❌ Failed to send rejection email:', {
          error: emailError,
          studentEmail: emailLower,
          ...(process.env.NODE_ENV === 'development' && {
            studentName: fullName,
            errorDetails: emailResult.errorDetails,
          }),
        });
        // Don't fail the rejection if email fails - just log it
      } else if (process.env.NODE_ENV === 'development') {
        console.log('✅ Rejection email sent successfully to:', emailLower);
      }
    }

    const res = NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
      emailSent,
      emailError: emailError || undefined,
    });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error rejecting application:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}







