import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAndUnlockAchievements } from '@/lib/achievements';

export async function POST(req: NextRequest) {
  try {
    const { email, chapterNumber, chapterSlug } = await req.json();

    if (!email || !chapterNumber || !chapterSlug) {
      return NextResponse.json(
        { error: 'Email, chapter number, and slug are required' },
        { status: 400 }
      );
    }

    // Get profile ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if student exists, create if missing
    let { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!student) {
      // Student record doesn't exist - create it automatically
      console.log(`[mark-completed] Creating missing student record for profile ${profile.id}`);
      const { data: newStudent, error: createError } = await supabaseAdmin
        .from('students')
        .insert({
          profile_id: profile.id,
          progress_percent: 0,
          assignments_completed: 0,
          projects_completed: 0,
          live_sessions_attended: 0,
        })
        .select('id')
        .single();

      if (createError || !newStudent) {
        console.error('[mark-completed] Failed to create student record:', createError);
        return NextResponse.json(
          { error: 'Failed to create student record. Please contact support.' },
          { status: 500 }
        );
      }

      student = newStudent;
      console.log(`[mark-completed] Successfully created student record for profile ${profile.id}`);
    }

    // Update or insert chapter progress
    const { data: existingProgress, error: checkError } = await supabaseAdmin
      .from('chapter_progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('chapter_number', chapterNumber)
      .maybeSingle();
    
    // Log error but continue (might be first time accessing chapter)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking chapter progress:', checkError);
    }

    // Check if chapter was already completed to avoid duplicate rewards
    const wasAlreadyCompleted = existingProgress?.is_completed === true;

    if (existingProgress) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('chapter_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);

      if (updateError) {
        console.error('Error updating chapter progress:', updateError);
        return NextResponse.json(
          { error: 'Failed to update chapter progress', details: updateError.message },
          { status: 500 }
        );
      }

      // Verify the update was successful
      const { data: verifyUpdate } = await supabaseAdmin
        .from('chapter_progress')
        .select('is_completed, completed_at')
        .eq('id', existingProgress.id)
        .single();
      
      if (verifyUpdate?.is_completed) {
        console.log(`[mark-completed] Successfully updated chapter ${chapterNumber} progress for student ${profile.id}`);
      } else {
        console.warn(`[mark-completed] Warning: Chapter ${chapterNumber} progress update may not have persisted for student ${profile.id}`);
      }

      // Unlock next chapter if it exists
      if (chapterNumber < 20) {
        const nextChapterNumber = chapterNumber + 1;
        // Get next chapter slug from chaptersContent
        const { chaptersContent } = await import('@/content/chaptersContent');
        const nextChapter = chaptersContent.find(c => c.number === nextChapterNumber);
        
        if (nextChapter) {
          // Check if next chapter progress already exists
          const { data: nextProgress } = await supabaseAdmin
            .from('chapter_progress')
            .select('id')
            .eq('student_id', profile.id)
            .eq('chapter_number', nextChapterNumber)
            .maybeSingle();

          if (!nextProgress) {
            // Create progress record for next chapter and unlock it
            await supabaseAdmin
              .from('chapter_progress')
              .insert({
                student_id: profile.id,
                chapter_number: nextChapterNumber,
                chapter_slug: nextChapter.slug,
                is_unlocked: true,
                is_completed: false,
                unlocked_at: new Date().toISOString(),
              });
          } else {
            // Update existing record to unlock
            await supabaseAdmin
              .from('chapter_progress')
              .update({
                is_unlocked: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', nextProgress.id);
          }
        }
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseAdmin
        .from('chapter_progress')
        .insert({
          student_id: profile.id,
          chapter_number: chapterNumber,
          chapter_slug: chapterSlug,
          is_completed: true,
          is_unlocked: true,
          completed_at: new Date().toISOString(),
          unlocked_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating chapter progress:', insertError);
        return NextResponse.json(
          { error: 'Failed to create chapter progress', details: insertError.message },
          { status: 500 }
        );
      }

      // Verify the insert was successful
      const { data: verifyInsert } = await supabaseAdmin
        .from('chapter_progress')
        .select('id, is_completed, completed_at')
        .eq('student_id', profile.id)
        .eq('chapter_number', chapterNumber)
        .single();
      
      if (verifyInsert?.is_completed) {
        console.log(`[mark-completed] Successfully created chapter ${chapterNumber} progress for student ${profile.id}`);
      } else {
        console.warn(`[mark-completed] Warning: Chapter ${chapterNumber} progress creation may not have persisted for student ${profile.id}`);
      }

      // Unlock next chapter if it exists (same logic as update path)
      if (chapterNumber < 20) {
        const nextChapterNumber = chapterNumber + 1;
        // Get next chapter slug from chaptersContent
        const { chaptersContent } = await import('@/content/chaptersContent');
        const nextChapter = chaptersContent.find(c => c.number === nextChapterNumber);
        
        if (nextChapter) {
          // Check if next chapter progress already exists
          const { data: nextProgress } = await supabaseAdmin
            .from('chapter_progress')
            .select('id')
            .eq('student_id', profile.id)
            .eq('chapter_number', nextChapterNumber)
            .maybeSingle();

          if (!nextProgress) {
            // Create progress record for next chapter and unlock it
            await supabaseAdmin
              .from('chapter_progress')
              .insert({
                student_id: profile.id,
                chapter_number: nextChapterNumber,
                chapter_slug: nextChapter.slug,
                is_unlocked: true,
                is_completed: false,
                unlocked_at: new Date().toISOString(),
              });
          } else {
            // Update existing record to unlock
            await supabaseAdmin
              .from('chapter_progress')
              .update({
                is_unlocked: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', nextProgress.id);
          }
        }
      }
    }

    // Award sats reward for completing chapter (only if not already completed)
    if (!wasAlreadyCompleted) {
      const rewardAmount = 100; // 100 sats for completing a chapter
      
      // Check if sats_rewards record exists
      const { data: existingReward } = await supabaseAdmin
        .from('sats_rewards')
        .select('*')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (existingReward) {
        // Update existing record
        await supabaseAdmin
          .from('sats_rewards')
          .update({
            amount_pending: (existingReward.amount_pending || 0) + rewardAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReward.id);
      } else {
        // Create new record
        await supabaseAdmin.from('sats_rewards').insert({
          student_id: profile.id,
          amount_pending: rewardAmount,
          reward_type: 'chapter',
          related_entity_type: 'chapter',
          related_entity_id: chapterNumber.toString(),
          reason: `Chapter ${chapterNumber} completed`,
          status: 'pending',
        });
      }
    }

    // Check and unlock achievements (only if not already completed to avoid duplicate checks)
    let newlyUnlockedAchievements: Array<{ id: string; title: string; icon: string; satsReward: number }> = [];
    if (!wasAlreadyCompleted) {
      try {
        newlyUnlockedAchievements = await checkAndUnlockAchievements(profile.id, supabaseAdmin);
      } catch (achievementError) {
        // Don't fail the request if achievement check fails
        console.error('Error checking achievements:', achievementError);
      }
    }

    // Final verification: Check that the chapter is marked as completed in the database
    const { data: finalCheck, error: finalCheckError } = await supabaseAdmin
      .from('chapter_progress')
      .select('is_completed, completed_at, chapter_number')
      .eq('student_id', profile.id)
      .eq('chapter_number', chapterNumber)
      .maybeSingle();

    if (finalCheckError) {
      console.error(`[mark-completed] Error verifying chapter completion:`, finalCheckError);
    }

    if (!finalCheck?.is_completed) {
      console.error(`[mark-completed] CRITICAL: Chapter ${chapterNumber} completion was not saved to database for student ${profile.id}`);
      return NextResponse.json({
        success: false,
        error: 'Chapter completion was not saved to database',
        chapterNumber,
      }, { status: 500 });
    }

    console.log(`[mark-completed] Verified: Chapter ${chapterNumber} is marked as completed for student ${profile.id} at ${finalCheck.completed_at}`);

    return NextResponse.json({
      success: true,
      message: 'Chapter marked as completed',
      chapterNumber,
      completedAt: finalCheck.completed_at,
      newlyUnlockedAchievements: newlyUnlockedAchievements.length > 0 ? newlyUnlockedAchievements : undefined,
    });
  } catch (error: any) {
    console.error('Error marking chapter as completed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}







