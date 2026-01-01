import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';

/**
 * POST /api/blog/submit
 * Submit a new blog post for review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      authorName,
      authorEmail,
      cohort,
      authorBio,
      title,
      category,
      content,
    } = body;

    // Validation
    if (!authorName || !authorEmail || !title || !category || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = validateAndNormalizeEmail(authorEmail);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email' },
        { status: 400 }
      );
    }

    // Check word count (minimum 500 for regular posts, 300 for pre-education, maximum 2000)
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const isPreEducation = category.trim().toLowerCase() === 'pre-education';
    const minWords = isPreEducation ? 300 : 500;
    
    if (wordCount < minWords) {
      return NextResponse.json(
        { error: `Content must be at least ${minWords} words${isPreEducation ? ' for pre-education posts' : ''}` },
        { status: 400 }
      );
    }
    if (wordCount > 2000) {
      return NextResponse.json(
        { error: 'Content must not exceed 2000 words' },
        { status: 400 }
      );
    }

    // Try to find author profile by email and check if they're a student
    let authorId = null;
    let isAcademyStudent = false;
    let studentCohort = null;
    let profileExists = false;
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', emailValidation.normalized!)
      .maybeSingle();

    if (profile) {
      profileExists = true;
      authorId = profile.id;
      
      // Check if this profile is a student
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('profile_id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (student) {
        isAcademyStudent = true;
        
        // Get cohort information if available
        const { data: profileWithCohort } = await supabaseAdmin
          .from('profiles')
          .select('cohort_id, student_id')
          .eq('id', profile.id)
          .maybeSingle();
        
        if (profileWithCohort?.cohort_id) {
          const { data: cohort } = await supabaseAdmin
            .from('cohorts')
            .select('name')
            .eq('id', profileWithCohort.cohort_id)
            .maybeSingle();
          
          studentCohort = cohort?.name || null;
        }
      }
    }

    // Create excerpt from first 200 characters
    const excerpt = content.substring(0, 200).trim() + '...';

    // Insert submission
    const { data: submission, error } = await supabaseAdmin
      .from('blog_submissions')
      .insert({
        author_id: authorId,
        author_name: authorName.trim(),
        author_email: emailValidation.normalized!,
        cohort: cohort?.trim() || null,
        author_bio: authorBio?.trim() || null,
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        status: 'pending',
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error creating blog submission:', error);
      return NextResponse.json(
        {
          error: 'Failed to submit blog post',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        },
        { status: 500 }
      );
    }

    // Warn user if they don't have a profile (they won't receive sats if approved)
    let warningMessage = '';
    if (!profileExists) {
      warningMessage = ' Note: To receive sats rewards when your blog is approved, please sign up first at /apply or /register.';
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Blog post submitted successfully. We will review it and get back to you within 5-7 business days.' + warningMessage,
        submissionId: submission.id,
        isAcademyStudent: isAcademyStudent,
        cohort: studentCohort,
        profileExists: profileExists,
        warning: warningMessage || null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in blog submit API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
