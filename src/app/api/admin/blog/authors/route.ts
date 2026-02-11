import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/blog/authors
 * Get all students who have written published blog posts
 * This is optimized specifically for blog-related operations
 * 
 * Query params:
 * - cohort_id: Filter by cohort ID
 * - search: Search by name or email
 * - limit: Number of results (default: 1000, max: 5000)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cohortId = searchParams.get('cohort_id');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000', 10), 5000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // First, get all unique author IDs from published blog posts
    const { data: blogPosts, error: blogPostsError } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id')
      .eq('status', 'published')
      .not('author_id', 'is', null);

    if (blogPostsError) {
      console.error('[Blog Authors API] Error fetching blog posts:', blogPostsError);
      return NextResponse.json(
        { error: 'Failed to fetch blog authors', details: blogPostsError.message },
        { status: 500 }
      );
    }

    // Get unique author IDs
    const authorIds = [...new Set((blogPosts || []).map((p: any) => p.author_id).filter(Boolean))];

    if (authorIds.length === 0) {
      return NextResponse.json(
        {
          authors: [],
          pagination: { total: 0, limit, offset, hasMore: false },
        },
        { status: 200 }
      );
    }

    // Now fetch profiles for these authors with filters
    let query = supabaseAdmin
      .from('profiles')
      .select('id, name, email, status, cohort_id', { count: 'exact' })
      .in('id', authorIds);

    // Apply filters
    if (cohortId) {
      query = query.eq('cohort_id', cohortId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: profiles, error: profilesError, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error('[Blog Authors API] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch blog authors', details: profilesError.message },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const authors = (profiles || []).map((profile: any) => ({
      id: profile.id,
      name: profile.name || profile.email || 'Unknown',
      email: profile.email || '',
      status: profile.status || 'New',
      cohort_id: profile.cohort_id || null,
    }));

    return NextResponse.json(
      {
        authors,
        pagination: {
          total: count || authors.length,
          limit,
          offset,
          hasMore: offset + authors.length < (count || authors.length),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Blog Authors API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

