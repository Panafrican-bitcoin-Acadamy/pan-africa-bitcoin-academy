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

      // Also get approved submissions that might not have blog posts yet
      // (in case some were approved before blog post creation was working)
      const { data: approvedSubmissions, error: submissionsError } = await supabaseAdmin
        .from('blog_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching approved submissions:', submissionsError);
        // Don't fail - just log the error and continue with posts only
      }

      // Get all blog post IDs to check which submissions already have posts
      const postIds = new Set((posts || []).map((p: any) => p.id));
      
      // Convert approved submissions to blog post format (if they don't have a post yet)
      const submissionsAsPosts = (approvedSubmissions || [])
        .filter((sub: any) => {
          // Only include if we can't find a matching blog post
          // We'll match by checking if there's a post with the same author_id and similar title
          const hasMatchingPost = (posts || []).some((p: any) => 
            p.author_id === sub.author_id && 
            p.title.toLowerCase().trim() === sub.title.toLowerCase().trim()
          );
          return !hasMatchingPost;
        })
        .map((sub: any) => {
          // Convert submission to blog post format
          const excerpt = sub.content ? (sub.content.substring(0, 200).trim() + '...') : '';
          return {
            id: `submission-${sub.id}`, // Prefix to distinguish from real posts
            slug: sub.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim() || `submission-${sub.id}`,
            title: sub.title,
            author_id: sub.author_id,
            author_name: sub.author_name,
            author_role: sub.cohort ? `Graduate, ${sub.cohort}` : null,
            author_country: null,
            author_bio: sub.author_bio,
            category: sub.category,
            excerpt: excerpt,
            content: sub.content,
            status: 'published', // Approved submissions are considered published
            is_featured: false,
            is_blog_of_month: false,
            published_at: sub.reviewed_at || sub.created_at,
            created_at: sub.created_at,
            updated_at: sub.updated_at || sub.reviewed_at || sub.created_at,
            _isFromSubmission: true, // Flag to indicate this came from a submission
            _submissionId: sub.id, // Keep reference to original submission
          };
        });

      // Combine posts and submissions, with posts taking priority
      const allPosts = [...(posts || []), ...submissionsAsPosts].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      return NextResponse.json(
        {
          posts: allPosts,
          total: allPosts.length,
          postsFromTable: (posts || []).length,
          postsFromSubmissions: submissionsAsPosts.length,
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
