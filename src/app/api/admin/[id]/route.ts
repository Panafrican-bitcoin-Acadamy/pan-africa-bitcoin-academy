import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/admin/[id]
 * Delete an admin account
 * Requires authentication and admin privileges
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: adminId } = await params;

    // Prevent self-deletion
    if (adminId === session.adminId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if admin exists
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('id, email, first_name, last_name')
      .eq('id', adminId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching admin:', fetchError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Delete the admin
    const { error: deleteError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (deleteError) {
      console.error('Error deleting admin:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Admin "${admin.first_name} ${admin.last_name}" (${admin.email}) has been deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}

