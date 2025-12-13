import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

// CSV Upload endpoint for Google Meet attendance
// Expected CSV format: Email, Name, Join Time, Leave Time, Duration (minutes)
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: 'File and eventId are required' },
        { status: 400 }
      );
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, type, chapter_number, cohort_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Find column indices
    const emailIdx = headers.findIndex(h => h.includes('email'));
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const joinTimeIdx = headers.findIndex(h => h.includes('join') || h.includes('joined'));
    const leaveTimeIdx = headers.findIndex(h => h.includes('leave') || h.includes('left'));
    const durationIdx = headers.findIndex(h => h.includes('duration') || h.includes('time'));

    if (emailIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must contain an Email column' },
        { status: 400 }
      );
    }

    // Get all profiles for email matching
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email');

    const emailToProfileId = new Map(
      (profiles || []).map((p: any) => [p.email.toLowerCase(), p.id])
    );

    // Process attendance records
    const records = [];
    const errors = [];
    let processed = 0;
    let matched = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const email = values[emailIdx]?.toLowerCase();
      
      if (!email) continue;

      const studentId = emailToProfileId.get(email);
      if (!studentId) {
        errors.push(`No student found for email: ${email}`);
        continue;
      }

      const name = nameIdx >= 0 ? values[nameIdx] : null;
      const joinTime = joinTimeIdx >= 0 ? parseDateTime(values[joinTimeIdx]) : null;
      const leaveTime = leaveTimeIdx >= 0 ? parseDateTime(values[leaveTimeIdx]) : null;
      const duration = durationIdx >= 0 ? parseInt(values[durationIdx]) || null : null;

      records.push({
        student_id: studentId,
        event_id: eventId,
        email: email,
        name: name,
        join_time: joinTime,
        leave_time: leaveTime,
        duration_minutes: duration,
      });

      processed++;
      matched++;
    }

    // Insert attendance records (upsert to handle duplicates)
    if (records.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('attendance')
        .upsert(records, {
          onConflict: 'student_id,event_id',
        });

      if (insertError) {
        console.error('Error inserting attendance:', insertError);
        return NextResponse.json(
          { error: 'Failed to save attendance records', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      event: { id: event.id, name: event.name },
      processed,
      matched,
      errors: errors.slice(0, 10), // Return first 10 errors
      totalErrors: errors.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing attendance CSV:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper to parse various date/time formats
function parseDateTime(value: string): string | null {
  if (!value) return null;
  
  try {
    // Try ISO format first
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Try common formats
    const formats = [
      /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
      /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/,
      /(\d{2}-\d{2}-\d{4} \d{2}:\d{2})/,
    ];
    
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}




