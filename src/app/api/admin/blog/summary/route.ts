import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/blog/summary
 * Get blog summary with authors, sats received, categories, and other blog data
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all published blog posts
    const { data: blogPosts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('[Blog Summary API] Error fetching blog posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }

    if (!blogPosts || blogPosts.length === 0) {
      return NextResponse.json({
        blogs: [],
        authors: [],
        summary: {
          totalBlogs: 0,
          totalAuthors: 0,
          totalSats: 0,
          categories: {},
          featuredBlogs: 0,
          blogOfMonth: 0,
        },
      });
    }

    // Get unique author IDs from published blog posts only
    const authorIds = [...new Set(blogPosts.map((p: any) => p.author_id).filter(Boolean))];

    if (authorIds.length === 0) {
      return NextResponse.json({
        blogs: [],
        authors: [],
        summary: {
          totalBlogs: 0,
          totalAuthors: 0,
          totalSats: 0,
          categories: {},
          featuredBlogs: 0,
          blogOfMonth: 0,
        },
      });
    }

    console.log(`[Blog Summary API] Found ${authorIds.length} unique authors from ${blogPosts.length} published blog posts`);

    // Optimized: Fetch sats rewards and profiles in parallel for better performance
    // Handle batching for large author lists (Supabase .in() limit is 1000)
    const batchSize = 1000;
    const needsBatching = authorIds.length > batchSize;
    
    const fetchProfilesBatched = async () => {
      if (!needsBatching) {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email, cohort_id')
          .in('id', authorIds);
        return { data: data || [], error };
      }
      
      // Batch profiles fetch
      const batches = [];
      for (let i = 0; i < authorIds.length; i += batchSize) {
        batches.push(authorIds.slice(i, i + batchSize));
      }
      
      const allProfiles: any[] = [];
      let lastError = null;
      for (const batch of batches) {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email, cohort_id')
          .in('id', batch);
        
        if (error) {
          lastError = error;
          console.error(`[Blog Summary API] Error fetching profiles batch:`, error);
        } else if (data) {
          allProfiles.push(...data);
        }
      }
      return { data: allProfiles, error: lastError };
    };

    const fetchSatsRewardsBatched = async () => {
      if (!needsBatching) {
        const { data, error } = await supabaseAdmin
          .from('sats_rewards')
          .select('student_id, amount_paid, amount_pending')
          .eq('reward_type', 'blog')
          .in('student_id', authorIds);
        return { data: data || [], error };
      }
      
      // Batch sats rewards fetch
      const batches = [];
      for (let i = 0; i < authorIds.length; i += batchSize) {
        batches.push(authorIds.slice(i, i + batchSize));
      }
      
      const allRewards: any[] = [];
      let lastError = null;
      for (const batch of batches) {
        const { data, error } = await supabaseAdmin
          .from('sats_rewards')
          .select('student_id, amount_paid, amount_pending')
          .eq('reward_type', 'blog')
          .in('student_id', batch);
        
        if (error) {
          lastError = error;
          console.error(`[Blog Summary API] Error fetching sats rewards batch:`, error);
        } else if (data) {
          allRewards.push(...data);
        }
      }
      return { data: allRewards, error: lastError };
    };

    // Fetch both in parallel
    const [satsRewardsResult, profilesResult] = await Promise.all([
      fetchSatsRewardsBatched(),
      fetchProfilesBatched(),
    ]);

    // Process sats rewards
    let satsRewardsMap: Record<string, { totalPaid: number; totalPending: number; total: number }> = {};
    if (!satsRewardsResult.error && satsRewardsResult.data) {
      satsRewardsResult.data.forEach((reward: any) => {
        const authorId = reward.student_id;
        if (!satsRewardsMap[authorId]) {
          satsRewardsMap[authorId] = { totalPaid: 0, totalPending: 0, total: 0 };
        }
        satsRewardsMap[authorId].totalPaid += reward.amount_paid || 0;
        satsRewardsMap[authorId].totalPending += reward.amount_pending || 0;
        satsRewardsMap[authorId].total += (reward.amount_paid || 0) + (reward.amount_pending || 0);
      });
    }

    // Process profiles
    const profilesMap: Record<string, any> = {};
    if (!profilesResult.error && profilesResult.data) {
      profilesResult.data.forEach((profile: any) => {
        profilesMap[profile.id] = profile;
      });
    }

    // Enrich blog posts with sats and author info
    const enrichedBlogs = blogPosts.map((post: any) => {
      const authorId = post.author_id;
      const sats = satsRewardsMap[authorId] || { totalPaid: 0, totalPending: 0, total: 0 };
      const profile = profilesMap[authorId] || null;

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        author_id: authorId,
        author_name: post.author_name || profile?.name || 'Unknown',
        author_email: profile?.email || null,
        author_role: post.author_role,
        author_country: post.author_country,
        category: post.category,
        published_at: post.published_at,
        created_at: post.created_at,
        is_featured: post.is_featured || false,
        is_blog_of_month: post.is_blog_of_month || false,
        sats_paid: sats.totalPaid,
        sats_pending: sats.totalPending,
        sats_total: sats.total,
      };
    });

    // Calculate summary statistics
    const totalBlogs = enrichedBlogs.length;
    const totalAuthors = new Set(enrichedBlogs.map((b: any) => b.author_id).filter(Boolean)).size;
    const totalSats = enrichedBlogs.reduce((sum: number, b: any) => sum + b.sats_total, 0);
    
    // Count blogs by category
    const categories: Record<string, number> = {};
    enrichedBlogs.forEach((blog: any) => {
      const cat = blog.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Group blogs by author for summary
    const blogsByAuthor: Record<string, any[]> = {};
    enrichedBlogs.forEach((blog: any) => {
      const authorId = blog.author_id;
      if (!blogsByAuthor[authorId]) {
        blogsByAuthor[authorId] = [];
      }
      blogsByAuthor[authorId].push(blog);
    });

    // Create author summary
    const authorSummary = Object.entries(blogsByAuthor).map(([authorId, blogs]) => {
      const firstBlog = blogs[0];
      const totalSatsForAuthor = blogs.reduce((sum: number, b: any) => sum + b.sats_total, 0);
      const categoriesForAuthor = [...new Set(blogs.map((b: any) => b.category))];

      return {
        author_id: authorId,
        author_name: firstBlog.author_name,
        author_email: firstBlog.author_email,
        author_role: firstBlog.author_role,
        author_country: firstBlog.author_country,
        total_blogs: blogs.length,
        categories: categoriesForAuthor,
        sats_paid: blogs.reduce((sum: number, b: any) => sum + b.sats_paid, 0),
        sats_pending: blogs.reduce((sum: number, b: any) => sum + b.sats_pending, 0),
        sats_total: totalSatsForAuthor,
        latest_blog_date: blogs[0].published_at, // Already sorted by published_at desc
      };
    }).sort((a, b) => new Date(b.latest_blog_date).getTime() - new Date(a.latest_blog_date).getTime());

    return NextResponse.json({
      blogs: enrichedBlogs,
      authors: authorSummary,
      summary: {
        totalBlogs,
        totalAuthors,
        totalSats,
        categories,
        featuredBlogs: enrichedBlogs.filter((b: any) => b.is_featured).length,
        blogOfMonth: enrichedBlogs.filter((b: any) => b.is_blog_of_month).length,
      },
    });
  } catch (error: any) {
    console.error('[Blog Summary API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

