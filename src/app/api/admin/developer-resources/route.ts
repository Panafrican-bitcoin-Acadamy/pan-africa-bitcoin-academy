import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/developer-resources
 * Get all developer resources
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: resources, error } = await supabaseAdmin
      .from('developer_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Developer Resources API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch developer resources', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ resources: resources || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Developer Resources API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/developer-resources
 * Create a new developer resource
 */
export async function POST(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, category, level, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: resource, error } = await supabaseAdmin
      .from('developer_resources')
      .insert({
        title,
        url,
        category,
        level,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin Developer Resources API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to create resource', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Developer Resources API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

