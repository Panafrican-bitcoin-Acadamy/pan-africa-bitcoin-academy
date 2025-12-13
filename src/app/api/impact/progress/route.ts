import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    // Get all students with their progress data
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        profile_id,
        progress_percent,
        assignments_completed,
        status
      `);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch students',
          ...(process.env.NODE_ENV === 'development' ? { details: studentsError.message } : {})
        },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json({
        completionRate: 0,
        attendanceRate: 0,
        avgAssignmentScore: 0,
      });
    }

    // 1. Calculate Completion Rate (average of all students' progress_percent)
    // This represents the average completion percentage across all students
    const totalProgress = students.reduce((sum: number, s: any) => {
      return sum + (s.progress_percent || 0);
    }, 0);
    const completionRate = Math.round(totalProgress / students.length);

    // 2. Calculate Attendance Rate (average of live_sessions_attended / total live-class events)
    const { data: liveClassEvents, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('type', 'live-class');

    const totalLiveLectures = liveClassEvents?.length || 0;

    // Get attendance data for all students
    const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('student_id, event_id');

    let avgAttendanceRate = 0;
    if (!attendanceError && attendanceRecords && totalLiveLectures > 0) {
      // Group attendance by student
      const attendanceByStudent = new Map<string, Set<string>>();
      attendanceRecords.forEach((record: any) => {
        if (!attendanceByStudent.has(record.student_id)) {
          attendanceByStudent.set(record.student_id, new Set());
        }
        attendanceByStudent.get(record.student_id)?.add(record.event_id);
      });

      // Calculate average attendance
      const attendanceRates: number[] = [];
      students.forEach((student: any) => {
        const studentAttendance = attendanceByStudent.get(student.profile_id)?.size || 0;
        const studentAttendanceRate = (studentAttendance / totalLiveLectures) * 100;
        attendanceRates.push(Math.min(100, studentAttendanceRate));
      });

      if (attendanceRates.length > 0) {
        avgAttendanceRate = Math.round(
          attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length
        );
      }
    }

    // 3. Calculate Average Assignment Score
    // Average assignment completion percentage across all students
    // Using assignments_completed as a percentage of total assignments
    const totalAssignments = 20; // Total assignments in the curriculum
    let avgAssignmentScore = 0;
    if (students.length > 0 && totalAssignments > 0) {
      const assignmentScores = students.map((s: any) => {
        const completed = s.assignments_completed || 0;
        // Calculate percentage for each student, cap at 100%
        return Math.min(100, Math.round((completed / totalAssignments) * 100));
      });
      // Calculate average of all students' assignment scores
      avgAssignmentScore = Math.round(
        assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length
      );
    }

    return NextResponse.json({
      completionRate,
      attendanceRate: avgAttendanceRate,
      avgAssignmentScore,
    });
  } catch (error: any) {
    console.error('Error fetching impact progress:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

