import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * PATCH /api/admin/blog/update
 * Update a blog post (admin only)
 * Can update: status, is_featured, is_blog_of_month, and other fields
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, updates } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Get the current post
    const { data: currentPost, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !currentPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating status
    if (updates.status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(updates.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be draft, published, or archived' },
          { status: 400 }
        );
      }
      updateData.status = updates.status;
      
      // Set published_at if publishing for the first time
      if (updates.status === 'published' && !currentPost.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    // Allow updating featured status
    if (updates.is_featured !== undefined) {
      updateData.is_featured = Boolean(updates.is_featured);
    }

    // Allow updating blog of month status
    if (updates.is_blog_of_month !== undefined) {
      updateData.is_blog_of_month = Boolean(updates.is_blog_of_month);
    }

    // Allow updating other fields
    const allowedFields = ['title', 'slug', 'category', 'excerpt', 'content', 'author_name', 'author_role', 'author_country', 'author_bio'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating blog post:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update blog post',
          ...(process.env.NODE_ENV === 'development' ? { details: updateError.message } : {}),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Blog post updated successfully',
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in update blog API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

