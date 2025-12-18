import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin endpoint to grant exam access to a student
 */
export async function POST(req: NextRequest) {
  try {
    const { studentId, adminId } = await req.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if access already granted
    const { data: existingAccess, error: checkError } = await supabaseAdmin
      .from('exam_access')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingAccess) {
      return NextResponse.json({
        success: true,
        message: 'Exam access already granted',
        alreadyGranted: true,
      });
    }

    // Grant access
    const { data: access, error: accessError } = await supabaseAdmin
      .from('exam_access')
      .insert({
        student_id: studentId,
        granted_by: adminId || null,
      })
      .select()
      .single();

    if (accessError) {
      console.error('Error granting exam access:', accessError);
      return NextResponse.json(
        { error: 'Failed to grant exam access', details: accessError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Exam access granted to ${student.name || student.email}`,
      access,
    });
  } catch (error: any) {
    console.error('Error granting exam access:', error);
    return NextResponse.json(
      {
        error: 'Failed to grant exam access',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
