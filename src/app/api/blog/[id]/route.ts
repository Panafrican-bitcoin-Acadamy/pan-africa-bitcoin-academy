import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type BlogPostPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/blog/[id]
 * Get a single blog post by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: BlogPostPageProps
) {
  try {
    const { id } = await params;
    
    // Try to find by UUID first, then by slug
    let query = supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('status', 'published');

    // Check if id is UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      // Try by UUID first
      query = query.eq('id', id);
    } else {
      // Try by slug
      query = query.eq('slug', id);
    }

    const { data: posts, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching blog post:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch blog post',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        },
        { status: 500 }
      );
    }

    if (!posts) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Check if author is a student
    let isAcademyStudent = false;
    let studentCohort = null;
    if (posts.author_id) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('profile_id')
        .eq('profile_id', posts.author_id)
        .maybeSingle();
      
      if (student) {
        isAcademyStudent = true;
        
        // Get cohort information
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('cohort_id, student_id')
          .eq('id', posts.author_id)
          .maybeSingle();
        
        if (profile?.cohort_id) {
          const { data: cohort } = await supabaseAdmin
            .from('cohorts')
            .select('name')
            .eq('id', profile.cohort_id)
            .maybeSingle();
          
          studentCohort = cohort?.name || null;
        }
      }
    }

    // Get tips total for this post
    const { data: tips } = await supabaseAdmin
      .from('blog_tips')
      .select('amount_sats')
      .eq('post_id', posts.id)
      .eq('status', 'paid');

    const totalTips = (tips || []).reduce(
      (sum: number, tip: any) => sum + (tip.amount_sats || 0),
      0
    );

    // Format the post
    const formattedPost = {
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      author: posts.author_name,
      authorRole: posts.author_role || '',
      country: posts.author_country || '',
      date: posts.published_at
        ? new Date(posts.published_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date(posts.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
      category: posts.category,
      readTime: `${posts.read_time || 5} min read`,
      image: posts.image_emoji || '📝',
      content: posts.content,
      excerpt: posts.excerpt,
      authorBio: posts.author_bio || '',
      satsAmount: totalTips || posts.sats_amount || 0,
      isAcademyStudent: isAcademyStudent,
      studentCohort: studentCohort,
      publishedAt: posts.published_at,
      createdAt: posts.created_at,
    };

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error: any) {
    console.error('Error in blog post API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
