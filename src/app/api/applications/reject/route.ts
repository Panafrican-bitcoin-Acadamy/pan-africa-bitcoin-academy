import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { sendRejectionEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, rejectedReason, rejectedBy } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
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

    // Update application status to Rejected
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'Rejected',
        rejected_reason: rejectedReason || null,
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
    
    const emailLower = application.email?.toLowerCase().trim();
    const fullName = `${application.first_name || ''} ${application.last_name || ''}`.trim();
    
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
        rejectionReason: rejectedReason || undefined,
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







