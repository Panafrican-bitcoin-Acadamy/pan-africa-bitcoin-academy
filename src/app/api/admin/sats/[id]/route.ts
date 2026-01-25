import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * PATCH /api/admin/sats/[id]
 * Update a sats reward
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, amount_paid, amount_pending, reason } = body;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }
    if (amount_paid !== undefined) {
      updateData.amount_paid = amount_paid;
    }
    if (amount_pending !== undefined) {
      updateData.amount_pending = amount_pending;
    }
    if (reason !== undefined) {
      updateData.reason = reason;
    }

    const { data, error } = await supabaseAdmin
      .from('sats_rewards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sats reward:', error);
      return NextResponse.json(
        {
          error: 'Failed to update sats reward',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward: data }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/sats/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sats/[id]
 * Delete a sats reward
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('sats_rewards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sats reward:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete sats reward',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/sats/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

