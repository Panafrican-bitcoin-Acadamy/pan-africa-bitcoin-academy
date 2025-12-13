import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, chapterNumber, chapterSlug } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', hasAccess: false, isRegistered: false },
        { status: 400 }
      );
    }

    if (!chapterNumber || !chapterSlug) {
      return NextResponse.json(
        { error: 'Chapter number and slug are required', hasAccess: false },
        { status: 400 }
      );
    }

    // Step 1: Check if user has a profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status, cohort_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      // User is not registered - redirect to apply
      return NextResponse.json({
        hasAccess: false,
        isRegistered: false,
        isEnrolled: false,
        redirectTo: '/apply',
        message: 'Please register to access chapters',
      });
    }

    // Step 2: Check if user is enrolled (has student record)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, profile_id')
      .eq('profile_id', profile.id)
      .single();

    if (studentError || !student) {
      // User is registered but not enrolled - redirect to apply
      return NextResponse.json({
        hasAccess: false,
        isRegistered: true,
        isEnrolled: false,
        redirectTo: '/apply',
        message: 'Please enroll in a cohort to access chapters',
      });
    }

    // Step 3: Check chapter unlock status
    // First check if chapter_progress table exists (might not be migrated yet)
    let chapterProgress = null;
    let progressError = null;
    
    try {
      const progressResult = await supabaseAdmin
        .from('chapter_progress')
        .select('*')
        .eq('student_id', profile.id)
        .eq('chapter_number', chapterNumber)
        .maybeSingle();
      
      chapterProgress = progressResult.data;
      progressError = progressResult.error;
    } catch (tableError: any) {
      // Table might not exist - that's okay, we'll handle it
      console.log('Chapter progress table might not exist yet:', tableError.message);
      progressError = tableError;
    }

    // If no progress record exists, check if this is Chapter 1 (should be unlocked by default)
    if (progressError || !chapterProgress) {
      // If table doesn't exist or Chapter 1, allow access
      if (chapterNumber === 1) {
        // Chapter 1 should be unlocked for all enrolled students
        // Try to create the progress record (might fail if table doesn't exist, that's okay)
        try {
          await supabaseAdmin
            .from('chapter_progress')
            .insert({
              student_id: profile.id,
              chapter_number: 1,
              chapter_slug: chapterSlug,
              is_unlocked: true,
              unlocked_at: new Date().toISOString(),
            });
        } catch (insertError) {
          // Table might not exist - that's fine, we'll still allow access
          console.log('Could not create chapter progress (table might not exist):', insertError);
        }

        // Always allow Chapter 1 for enrolled students
        return NextResponse.json({
          hasAccess: true,
          isRegistered: true,
          isEnrolled: true,
          isUnlocked: true,
          isCompleted: false,
          chapterNumber: 1,
        });
      }

      // For other chapters, check if previous chapter is completed
      if (chapterNumber > 1) {
        try {
          const previousResult = await supabaseAdmin
            .from('chapter_progress')
            .select('is_completed')
            .eq('student_id', profile.id)
            .eq('chapter_number', chapterNumber - 1)
            .maybeSingle();

          const previousChapter = previousResult.data;

          if (previousChapter && previousChapter.is_completed) {
            // Previous chapter is completed, unlock this one
            try {
              await supabaseAdmin
                .from('chapter_progress')
                .insert({
                  student_id: profile.id,
                  chapter_number: chapterNumber,
                  chapter_slug: chapterSlug,
                  is_unlocked: true,
                  unlocked_at: new Date().toISOString(),
                });
            } catch (insertError) {
              console.log('Could not create chapter progress:', insertError);
            }

            return NextResponse.json({
              hasAccess: true,
              isRegistered: true,
              isEnrolled: true,
              isUnlocked: true,
              isCompleted: false,
              chapterNumber,
            });
          } else {
            // Previous chapter not completed - locked
            return NextResponse.json({
              hasAccess: false,
              isRegistered: true,
              isEnrolled: true,
              isUnlocked: false,
              redirectTo: '/chapters',
              message: `Please complete Chapter ${chapterNumber - 1} first`,
            });
          }
        } catch (checkError) {
          // If we can't check previous chapter (table doesn't exist), allow access for now
          // This is a fallback until migration is run
          console.log('Could not check previous chapter, allowing access:', checkError);
          return NextResponse.json({
            hasAccess: true,
            isRegistered: true,
            isEnrolled: true,
            isUnlocked: true,
            isCompleted: false,
            chapterNumber,
            note: 'Database migration pending - all chapters unlocked',
          });
        }
      }
    }

    // Chapter progress exists - check if unlocked
    if (chapterProgress) {
      if (chapterProgress.is_unlocked) {
        return NextResponse.json({
          hasAccess: true,
          isRegistered: true,
          isEnrolled: true,
          isUnlocked: true,
          isCompleted: chapterProgress.is_completed || false,
          chapterNumber,
        });
      } else {
        // Chapter is locked
        return NextResponse.json({
          hasAccess: false,
          isRegistered: true,
          isEnrolled: true,
          isUnlocked: false,
          redirectTo: '/chapters',
          message: `Please complete previous chapters first`,
        });
      }
    }

    // If we get here and no progress record exists, and it's not Chapter 1,
    // and we couldn't check previous chapter, allow access as fallback
    // (This handles the case where table doesn't exist yet)
    return NextResponse.json({
      hasAccess: true,
      isRegistered: true,
      isEnrolled: true,
      isUnlocked: true,
      isCompleted: false,
      chapterNumber,
      note: 'Database migration pending - allowing access',
    });
  } catch (error: any) {
    console.error('Error checking chapter access:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        hasAccess: false,
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}


  }
}

