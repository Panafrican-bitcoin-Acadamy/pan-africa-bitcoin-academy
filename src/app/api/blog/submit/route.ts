import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail, sanitizeName, sanitizeTextContent } from '@/lib/validation';
import { requireStudent } from '@/lib/session';
import { requireAdmin } from '@/lib/adminSession';

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
      cohortId,
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

    // Sanitize inputs
    const sanitizedAuthorName = sanitizeName(authorName, 100);
    const sanitizedTitle = sanitizeTextContent(title, 200);
    const sanitizedCategory = String(category).substring(0, 50);
    const sanitizedBio = authorBio ? sanitizeTextContent(authorBio, 500) : null;
    const sanitizedContent = sanitizeTextContent(content, 50000); // Max 50k chars
    
    // Validate sanitized inputs
    if (!sanitizedAuthorName || sanitizedAuthorName.length < 2) {
      return NextResponse.json(
        { error: 'Author name must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    if (!sanitizedTitle || sanitizedTitle.length < 10) {
      return NextResponse.json(
        { error: 'Title must be at least 10 characters' },
        { status: 400 }
      );
    }
    
    if (!sanitizedContent || sanitizedContent.length < 100) {
      return NextResponse.json(
        { error: 'Content must be at least 100 characters' },
        { status: 400 }
      );
    }

    // Check word count (minimum 500 for regular posts, 300 for pre-education, maximum 2000)
    const wordCount = sanitizedContent.trim().split(/\s+/).filter(Boolean).length;
    const isPreEducation = sanitizedCategory.trim().toLowerCase() === 'pre-education';
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

    // Check authentication - user must be logged in
    const studentSession = requireStudent(request);
    const adminSession = requireAdmin(request);
    
    if (!studentSession && !adminSession) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Verify email matches authenticated session
    const sessionEmail = (studentSession?.email || adminSession?.email)?.toLowerCase().trim();
    if (sessionEmail !== emailValidation.normalized) {
      return NextResponse.json(
        { error: 'Unauthorized. Email does not match your session.' },
        { status: 403 }
      );
    }

    // Try to find author profile by email (admins might not have profiles with matching IDs)
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
    const excerpt = sanitizedContent.substring(0, 200).trim() + '...';

    // Insert submission
    const { data: submission, error } = await supabaseAdmin
      .from('blog_submissions')
      .insert({
        author_id: authorId,
        author_name: sanitizedAuthorName,
        author_email: emailValidation.normalized!,
        cohort_id: cohortId || null,
        cohort: cohort ? String(cohort).substring(0, 100) : null,
        author_bio: sanitizedBio,
        title: sanitizedTitle,
        category: sanitizedCategory,
        content: sanitizedContent,
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
