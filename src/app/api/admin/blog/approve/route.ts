import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { BLOG_POST_REWARD_SATS, BLOG_REWARD_TYPE } from '@/lib/blog-rewards';
import { requireAdmin } from '@/lib/adminSession';

/**
 * POST /api/admin/blog/approve
 * Approve a blog submission and create a published blog post (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, slug, isFeatured, isBlogOfMonth } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Get the submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from('blog_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let postSlug = slug;
    if (!postSlug) {
      const slugBase = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      // Check if slug exists
      let slugCounter = 0;
      postSlug = slugBase;
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('blog_posts')
          .select('id')
          .eq('slug', postSlug)
          .maybeSingle();
        
        if (!existing) break;
        slugCounter++;
        postSlug = `${slugBase}-${slugCounter}`;
      }
    }

    // Calculate excerpt if needed
    const excerpt = submission.content.substring(0, 200).trim() + '...';

    // Check if author is a student
    let isAcademyStudent = false;
    if (submission.author_id) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('profile_id')
        .eq('profile_id', submission.author_id)
        .maybeSingle();
      
      if (student) {
        isAcademyStudent = true;
      }
    }

    // Create blog post
    const { data: blogPost, error: postError } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title: submission.title,
        slug: postSlug,
        author_id: submission.author_id,
        author_name: submission.author_name,
        author_role: submission.cohort ? `Graduate, ${submission.cohort}` : null,
        author_country: null, // Can be added later
        author_bio: submission.author_bio,
        category: submission.category,
        excerpt: excerpt,
        content: submission.content,
        status: 'published',
        is_featured: isFeatured || false,
        is_blog_of_month: isBlogOfMonth || false,
        published_at: new Date().toISOString(),
      })
      .select('id, slug')
      .single();

    if (postError) {
      console.error('Error creating blog post:', postError);
      return NextResponse.json(
        {
          error: 'Failed to create blog post',
          ...(process.env.NODE_ENV === 'development' ? { details: postError.message } : {}),
        },
        { status: 500 }
      );
    }

    // Update submission status
    const { error: updateError } = await supabaseAdmin
      .from('blog_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.adminId,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      // Don't fail - post is created, just log the error
    }

    // Award sats to the author
    let satsAwarded = false;
    let satsError = null;
    
    // Try to find author by author_id first (more reliable)
    let profileId = submission.author_id;
    
    if (!profileId && submission.author_email) {
      // Fallback to finding by email if author_id is not available
      const { data: authorProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', submission.author_email.toLowerCase().trim())
        .maybeSingle();

      if (profileError) {
        console.error('Error finding author profile:', profileError);
        satsError = 'Failed to find author profile';
      } else if (!authorProfile) {
        // Author doesn't exist in profiles - they need to sign up first
        satsError = 'Author not found in database. Please ask them to sign up first.';
      } else {
        profileId = authorProfile.id;
      }
    }

    if (profileId) {
      // Verify that the profile exists
      const { data: profileCheck, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error verifying profile:', profileCheckError);
        satsError = 'Failed to verify author profile';
      } else if (!profileCheck) {
        console.error('Profile not found:', profileId);
        satsError = 'Author profile not found in database';
      } else {
        // Check if a reward already exists for this blog post (prevent duplicates)
        const { data: existingReward, error: checkError } = await supabaseAdmin
          .from('sats_rewards')
          .select('id')
          .eq('student_id', profileId)
          .eq('related_entity_type', 'blog')
          .eq('related_entity_id', blogPost.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing reward:', checkError);
          satsError = `Failed to check existing rewards: ${checkError.message}`;
        } else if (existingReward) {
          // Reward already exists
          console.log('Sats reward already exists for this blog post');
          satsAwarded = true; // Consider it awarded since it already exists
        } else {
          // Create a new sats_rewards record for this blog post approval
          // This allows tracking each blog post separately while still summing totals
          // Prepare reward data with explicit types
          const rewardData: {
            student_id: string;
            amount_paid: number;
            amount_pending: number;
            reward_type: string;
            related_entity_type: string;
            related_entity_id: string;
            reason: string;
            status: string;
          } = {
            student_id: profileId,
            amount_paid: 0,
            amount_pending: BLOG_POST_REWARD_SATS,
            reward_type: BLOG_REWARD_TYPE,
            related_entity_type: 'blog',
            related_entity_id: blogPost.id,
            reason: `Blog post approved: "${submission.title}"`,
            status: 'pending',
          };

          // Validate all required fields
          if (!rewardData.student_id || !rewardData.related_entity_id) {
            console.error('Invalid reward data:', rewardData);
            satsError = 'Invalid reward data: missing required fields';
          } else {
            console.log('Creating sats reward with data:', {
              student_id: rewardData.student_id,
              amount_pending: rewardData.amount_pending,
              reward_type: rewardData.reward_type,
              related_entity_type: rewardData.related_entity_type,
              related_entity_id: rewardData.related_entity_id,
              status: rewardData.status,
              reason: rewardData.reason.substring(0, 50) + '...',
            });

            const { data: insertedReward, error: insertRewardError } = await supabaseAdmin
              .from('sats_rewards')
              .insert(rewardData)
              .select('id')
              .single();

            if (insertRewardError) {
              console.error('Error creating sats reward:', {
                error: insertRewardError,
                message: insertRewardError.message,
                code: insertRewardError.code,
                details: insertRewardError.details,
                hint: insertRewardError.hint,
                rewardData: {
                  student_id: rewardData.student_id,
                  amount_pending: rewardData.amount_pending,
                  reward_type: rewardData.reward_type,
                  related_entity_type: rewardData.related_entity_type,
                  related_entity_id: rewardData.related_entity_id,
                },
              });
              
              // Provide more helpful error messages based on error code
              if (insertRewardError.code === '23503') {
                satsError = `Foreign key constraint violation. Profile ${profileId} may not exist in profiles table.`;
              } else if (insertRewardError.code === '23514') {
                satsError = `Check constraint violation. Please verify reward_type, related_entity_type, and status values are valid.`;
              } else {
                satsError = `Failed to create sats reward: ${insertRewardError.message || 'Unknown error'}`;
                if (insertRewardError.code) {
                  satsError += ` (Code: ${insertRewardError.code})`;
                }
                if (insertRewardError.hint) {
                  satsError += ` Hint: ${insertRewardError.hint}`;
                }
              }
            } else if (insertedReward) {
              satsAwarded = true;
              console.log(`Successfully awarded ${BLOG_POST_REWARD_SATS} sats to profile ${profileId} for blog post ${blogPost.id}. Reward ID: ${insertedReward.id}`);
            } else {
              satsError = 'Failed to create sats reward: No data returned from insert';
            }
          }
        }
      }
    } else if (!satsError) {
      satsError = 'Author ID or email not found. Cannot award sats.';
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Blog post approved and published',
        post: {
          id: blogPost.id,
          slug: blogPost.slug,
        },
        satsAwarded: satsAwarded,
        satsAmount: satsAwarded ? BLOG_POST_REWARD_SATS : 0,
        satsError: satsError || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in approve blog API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
