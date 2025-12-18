import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin endpoint to revoke exam access from a student
 */
export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Remove access
    const { error: deleteError } = await supabaseAdmin
      .from('exam_access')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      console.error('Error revoking exam access:', deleteError);
      return NextResponse.json(
        { error: 'Failed to revoke exam access', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam access revoked',
    });
  } catch (error: any) {
    console.error('Error revoking exam access:', error);
    return NextResponse.json(
      {
        error: 'Failed to revoke exam access',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
