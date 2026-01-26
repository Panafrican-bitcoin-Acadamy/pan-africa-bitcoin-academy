import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { BLOG_POST_REWARD_SATS, BLOG_REWARD_TYPE } from '@/lib/blog-rewards';
import { requireAdmin } from '@/lib/adminSession';

/**
 * POST /api/admin/blog/award-sats
 * Retroactively award sats to students who have approved blog posts but don't have sats rewards yet
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { dryRun = false } = body; // If true, only report what would be done, don't actually create rewards

    // Get all published blog posts
    const { data: blogPosts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, author_id, author_email, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching blog posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts', details: postsError.message },
        { status: 500 }
      );
    }

    if (!blogPosts || blogPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published blog posts found',
        processed: 0,
        created: 0,
        skipped: 0,
        errors: [],
      });
    }

    // Get all existing sats rewards for blog posts
    const { data: existingRewards, error: rewardsError } = await supabaseAdmin
      .from('sats_rewards')
      .select('related_entity_id, student_id')
      .eq('related_entity_type', 'blog')
      .eq('reward_type', BLOG_REWARD_TYPE);

    if (rewardsError) {
      console.error('Error fetching existing rewards:', rewardsError);
      return NextResponse.json(
        { error: 'Failed to fetch existing rewards', details: rewardsError.message },
        { status: 500 }
      );
    }

    // Create a set of blog post IDs that already have rewards
    const rewardedBlogIds = new Set(
      (existingRewards || [])
        .map((r: any) => r.related_entity_id)
        .filter(Boolean)
    );

    // Process each blog post
    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [] as Array<{ blogId: string; title: string; error: string }>,
      details: [] as Array<{ blogId: string; title: string; author: string; action: string }>,
    };

    for (const post of blogPosts) {
      results.processed++;

      // Skip if reward already exists
      if (rewardedBlogIds.has(post.id)) {
        results.skipped++;
        results.details.push({
          blogId: post.id,
          title: post.title || 'Untitled',
          author: post.author_email || 'Unknown',
          action: 'Skipped - reward already exists',
        });
        continue;
      }

      // Find author profile
      let profileId = post.author_id;

      // If no author_id, try to find by email
      if (!profileId && post.author_email) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', post.author_email.toLowerCase().trim())
          .maybeSingle();

        if (profile) {
          profileId = profile.id;
        }
      }

      if (!profileId) {
        results.errors.push({
          blogId: post.id,
          title: post.title || 'Untitled',
          error: 'Author profile not found',
        });
        results.skipped++;
        continue;
      }

      // Create sats reward if not dry run
      if (!dryRun) {
        const { error: insertError } = await supabaseAdmin
          .from('sats_rewards')
          .insert({
            student_id: profileId,
            amount_paid: 0,
            amount_pending: BLOG_POST_REWARD_SATS,
            reward_type: BLOG_REWARD_TYPE,
            related_entity_type: 'blog',
            related_entity_id: post.id,
            reason: `Blog post approved: "${post.title || 'Untitled'}"`,
            status: 'pending',
            awarded_by: session.adminId,
          });

        if (insertError) {
          console.error(`Error creating reward for blog ${post.id}:`, insertError);
          results.errors.push({
            blogId: post.id,
            title: post.title || 'Untitled',
            error: insertError.message || 'Failed to create reward',
          });
          results.skipped++;
        } else {
          results.created++;
          results.details.push({
            blogId: post.id,
            title: post.title || 'Untitled',
            author: post.author_email || 'Unknown',
            action: 'Created reward',
          });
        }
      } else {
        // Dry run - just report what would be done
        results.created++;
        results.details.push({
          blogId: post.id,
          title: post.title || 'Untitled',
          author: post.author_email || 'Unknown',
          action: 'Would create reward',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry run complete. Would create ${results.created} rewards.`
        : `Processed ${results.processed} blog posts. Created ${results.created} rewards, skipped ${results.skipped}.`,
      ...results,
    });
  } catch (error: any) {
    console.error('Error in award sats API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}


