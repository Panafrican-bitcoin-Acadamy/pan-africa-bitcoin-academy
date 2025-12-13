import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

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

    const res = NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
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







