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
        updated_at: new Date().toISOString(), // Explicitly update updated_at
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
          // Prepare reward data with explicit types and validation
          // Ensure all values match the CHECK constraints exactly (case-sensitive!)
          const rewardData = {
            student_id: profileId,
            amount_paid: 0,
            amount_pending: BLOG_POST_REWARD_SATS,
            reward_type: 'blog' as const, // Must be lowercase 'blog' to match CHECK constraint
            related_entity_type: 'blog' as const, // Must be lowercase 'blog' to match CHECK constraint
            related_entity_id: blogPost.id,
            reason: `Blog post approved: "${submission.title}"`,
            status: 'pending' as const, // Must be lowercase 'pending' to match CHECK constraint
            awarded_by: session.adminId || null, // Optional: admin who awarded the reward
          };

          // Validate all required fields and CHECK constraint values
          const validRewardTypes = ['assignment', 'chapter', 'discussion', 'peer_help', 'project', 'attendance', 'blog', 'other'];
          const validRelatedEntityTypes = ['assignment', 'chapter', 'event', 'discussion', 'project', 'blog', 'other'];
          const validStatuses = ['pending', 'processing', 'paid', 'failed'];
          
          if (!rewardData.student_id || !rewardData.related_entity_id) {
            console.error('Invalid reward data - missing required fields:', {
              hasStudentId: !!rewardData.student_id,
              hasRelatedEntityId: !!rewardData.related_entity_id,
              rewardData,
            });
            satsError = 'Invalid reward data: missing required fields (student_id or related_entity_id)';
          } else if (!validRewardTypes.includes(rewardData.reward_type)) {
            console.error('Invalid reward data - invalid reward_type:', {
              reward_type: rewardData.reward_type,
              validTypes: validRewardTypes,
            });
            satsError = `Invalid reward_type: "${rewardData.reward_type}". Must be one of: ${validRewardTypes.join(', ')}`;
          } else if (!validRelatedEntityTypes.includes(rewardData.related_entity_type)) {
            console.error('Invalid reward data - invalid related_entity_type:', {
              related_entity_type: rewardData.related_entity_type,
              validTypes: validRelatedEntityTypes,
            });
            satsError = `Invalid related_entity_type: "${rewardData.related_entity_type}". Must be one of: ${validRelatedEntityTypes.join(', ')}`;
          } else if (!validStatuses.includes(rewardData.status)) {
            console.error('Invalid reward data - invalid status:', {
              status: rewardData.status,
              validStatuses: validStatuses,
            });
            satsError = `Invalid status: "${rewardData.status}". Must be one of: ${validStatuses.join(', ')}`;
          } else if (typeof rewardData.amount_pending !== 'number' || rewardData.amount_pending < 0) {
            console.error('Invalid reward data - invalid amount:', rewardData);
            satsError = 'Invalid reward data: invalid amount_pending value';
          } else {
            // Prepare insert data with all required fields explicitly set
            const insertData = {
              student_id: rewardData.student_id,
              amount_paid: rewardData.amount_paid,
              amount_pending: rewardData.amount_pending,
              reward_type: rewardData.reward_type,
              related_entity_type: rewardData.related_entity_type,
              related_entity_id: rewardData.related_entity_id,
              reason: rewardData.reason,
              status: rewardData.status,
              awarded_by: rewardData.awarded_by,
              // Explicitly set timestamps to ensure they're set
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            console.log('Creating sats reward with validated data:', {
              student_id: insertData.student_id,
              amount_pending: insertData.amount_pending,
              reward_type: insertData.reward_type,
              related_entity_type: insertData.related_entity_type,
              related_entity_id: insertData.related_entity_id,
              status: insertData.status,
              reason: insertData.reason.substring(0, 50) + '...',
              awarded_by: insertData.awarded_by,
            });

            const { data: insertedReward, error: insertRewardError } = await supabaseAdmin
              .from('sats_rewards')
              .insert(insertData)
              .select('id')
              .single();

            if (insertRewardError) {
              console.error('Error creating sats reward:', {
                error: insertRewardError,
                message: insertRewardError.message,
                code: insertRewardError.code,
                details: insertRewardError.details,
                hint: insertRewardError.hint,
                insertData: {
                  student_id: insertData.student_id,
                  amount_pending: insertData.amount_pending,
                  reward_type: insertData.reward_type,
                  related_entity_type: insertData.related_entity_type,
                  related_entity_id: insertData.related_entity_id,
                  status: insertData.status,
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
