import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/blog
 * Get all blog posts and submissions (admin only)
 * Query params:
 * - type: 'posts' or 'submissions'
 * - status: Filter by status
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'posts';
    const status = searchParams.get('status');

    if (type === 'submissions') {
      // Get submissions
      let query = supabaseAdmin
        .from('blog_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: submissions, error } = await query;

      if (error) {
        console.error('Error fetching blog submissions:', error);
        return NextResponse.json(
          {
            error: 'Failed to fetch submissions',
            ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          submissions: submissions || [],
          total: submissions?.length || 0,
        },
        { status: 200 }
      );
    } else {
      // Get all blog posts (including drafts)
      let query = supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json(
          {
            error: 'Failed to fetch blog posts',
            ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          posts: posts || [],
          total: posts?.length || 0,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error in admin blog API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
