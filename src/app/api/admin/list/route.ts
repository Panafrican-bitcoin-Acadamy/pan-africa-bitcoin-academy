import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/list
 * Get list of all admins
 * Requires authentication and admin privileges
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all admins with their profile information
    const { data: admins, error } = await supabaseAdmin
      .from('admins')
      .select(`
        id,
        email,
        first_name,
        last_name,
        position,
        access_level,
        role,
        phone,
        country,
        city,
        notes,
        email_verified,
        force_password_change,
        password_changed_at,
        created_at,
        created_by,
        locked_until,
        failed_login_attempts
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admins' },
        { status: 500 }
      );
    }

    // Transform admins to include full name and status
    const transformedAdmins = (admins || []).map((admin: any) => ({
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name || '',
      lastName: admin.last_name || '',
      fullName: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.email,
      position: admin.position || 'Not specified',
      accessLevel: admin.access_level || admin.role || 'standard',
      phone: admin.phone || 'Not provided',
      country: admin.country || 'Not provided',
      city: admin.city || 'Not provided',
      notes: admin.notes || '',
      emailVerified: admin.email_verified || false,
      requiresPasswordChange: admin.force_password_change || admin.password_changed_at === null,
      createdAt: admin.created_at,
      createdBy: admin.created_by,
      isLocked: admin.locked_until && new Date(admin.locked_until) > new Date(),
      failedLoginAttempts: admin.failed_login_attempts || 0,
    }));

    return NextResponse.json({
      success: true,
      admins: transformedAdmins,
      count: transformedAdmins.length,
    });
  } catch (error: any) {
    console.error('List admins error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

