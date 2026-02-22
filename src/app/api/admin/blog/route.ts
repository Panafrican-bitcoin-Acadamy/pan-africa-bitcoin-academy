import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/blog
 * Get all blog posts and submissions (admin only)
 * Query params:
 * - type: 'posts' or 'submissions'
 * - status: Filter by status
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'posts';
    const status = searchParams.get('status');

    if (type === 'submissions') {
      // Get submissions
      try {
        let query = supabaseAdmin
          .from('blog_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data: submissions, error } = await query;

        if (error) {
          console.error('[Admin Blog API] Error fetching blog submissions:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          return NextResponse.json(
            {
              error: 'Failed to fetch submissions',
              ...(process.env.NODE_ENV === 'development' 
                ? { 
                    details: error.message || 'Unknown database error',
                    code: error.code,
                    hint: error.hint,
                  } 
                : {}),
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
      } catch (queryError: any) {
        console.error('[Admin Blog API] Exception while fetching submissions:', queryError);
        return NextResponse.json(
          {
            error: 'Failed to fetch submissions',
            ...(process.env.NODE_ENV === 'development' 
              ? { details: queryError.message || 'Unknown error' } 
              : {}),
          },
          { status: 500 }
        );
      }
    } else {
      // Get all blog posts (including drafts)
      let query = supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: posts, error: postsError } = await query;

      if (postsError) {
        console.error('Error fetching blog posts:', postsError);
        return NextResponse.json(
          {
            error: 'Failed to fetch blog posts',
            ...(process.env.NODE_ENV === 'development' ? { details: postsError.message } : {}),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          posts: posts || [],
          total: (posts || []).length,
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
