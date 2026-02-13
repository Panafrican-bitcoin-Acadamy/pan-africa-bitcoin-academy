import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { validateUUID, secureEmailInput, secureTextInput } from '@/lib/security-utils';
import { containsSQLInjection, containsXSS } from '@/lib/input-security';
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit-log';

// CSV Upload endpoint for Google Meet attendance
// Expected CSV format: Email, Name, Join Time, Leave Time, Duration (minutes)

// Security constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
const MAX_ROWS = 10000; // Maximum number of rows to process
const ALLOWED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.csv', '.txt'];

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

    // Security: Validate eventId format (UUID)
    if (!validateUUID(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Security: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Security: Validate file type
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = file.type && ALLOWED_FILE_TYPES.includes(file.type);
    
    if (!hasValidExtension && !hasValidMimeType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are allowed.' },
        { status: 400 }
      );
    }

    // Security: Validate file name (prevent path traversal)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid file name' },
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

    // Parse CSV with security checks
    const text = await file.text();
    
    // Security: Check for malicious content in file
    if (containsSQLInjection(text) || containsXSS(text)) {
      return NextResponse.json(
        { error: 'File contains potentially dangerous content' },
        { status: 400 }
      );
    }

    // Security: Limit file content size
    if (text.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File content exceeds maximum size' },
        { status: 400 }
      );
    }

    const lines = text.split('\n').filter(line => line.trim());
    
    // Security: Limit number of rows
    if (lines.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `File contains too many rows. Maximum allowed: ${MAX_ROWS}` },
        { status: 400 }
      );
    }

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Security: Validate header row
    if (headers.length > 50) {
      return NextResponse.json(
        { error: 'CSV file contains too many columns' },
        { status: 400 }
      );
    }

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
      // Security: Limit processing to prevent DoS
      if (i > MAX_ROWS) {
        errors.push(`Processing stopped at row ${i}. Maximum ${MAX_ROWS} rows allowed.`);
        break;
      }

      const values = lines[i].split(',').map(v => v.trim());
      
      // Security: Validate row length
      if (values.length > 50) {
        errors.push(`Row ${i + 1} contains too many columns. Skipping.`);
        continue;
      }

      const emailRaw = values[emailIdx];
      if (!emailRaw) continue;

      // Security: Validate and sanitize email
      const emailValidation = secureEmailInput(emailRaw);
      if (!emailValidation.valid || !emailValidation.normalized) {
        errors.push(`Row ${i + 1}: Invalid email format: ${emailRaw.substring(0, 50)}`);
        continue;
      }
      const email = emailValidation.normalized.toLowerCase();

      const studentId = emailToProfileId.get(email);
      if (!studentId) {
        errors.push(`Row ${i + 1}: No student found for email: ${email}`);
        continue;
      }

      // Security: Sanitize name if present
      let name = null;
      if (nameIdx >= 0 && values[nameIdx]) {
        const nameValidation = secureTextInput(values[nameIdx], { maxLength: 200 });
        if (nameValidation.valid && nameValidation.sanitized) {
          name = nameValidation.sanitized;
        }
      }

      const joinTime = joinTimeIdx >= 0 ? parseDateTime(values[joinTimeIdx]) : null;
      const leaveTime = leaveTimeIdx >= 0 ? parseDateTime(values[leaveTimeIdx]) : null;
      
      // Security: Validate duration (must be positive integer)
      let duration = null;
      if (durationIdx >= 0 && values[durationIdx]) {
        const durationValue = parseInt(values[durationIdx]);
        if (!isNaN(durationValue) && durationValue >= 0 && durationValue <= 1440) { // Max 24 hours
          duration = durationValue;
        }
      }

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

    // Security: Log the upload action for audit purposes
    logAdminAction(
      AUDIT_ACTIONS.ATTENDANCE_UPLOADED,
      session.adminId,
      session.email,
      'attendance',
      {
        resourceId: eventId,
        details: {
          eventName: event.name,
          eventType: event.type,
          rowsProcessed: processed,
          rowsMatched: matched,
          errorCount: errors.length,
          fileName: file.name,
          fileSize: file.size,
        },
      }
    );

    const res = NextResponse.json({
      success: true,
      event: { id: event.id, name: event.name },
      processed,
      matched,
      errors: errors.slice(0, 10), // Return first 10 errors
      totalErrors: errors.length,
    }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error processing attendance CSV:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
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









