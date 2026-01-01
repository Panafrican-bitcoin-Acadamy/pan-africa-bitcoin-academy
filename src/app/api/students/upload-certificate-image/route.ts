import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { requireStudent } from '@/lib/session';

/**
 * Upload certificate image for a student
 * This is optional - students can upload their photo for certificates
 * If uploaded, it can optionally be synced to their profile picture
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = requireStudent(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageData, useAsProfilePicture } = await req.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validate image data format
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload a valid image file.' },
        { status: 400 }
      );
    }

    // Check image size (max 5MB)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageSizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    if (imageSizeInBytes > maxSizeInBytes) {
      return NextResponse.json(
        { error: 'Image size exceeds 5MB limit. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const imageType = imageData.split(';')[0].split(':')[1];
    if (!allowedTypes.includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please upload JPEG, PNG, or WebP (certificate-quality images).' },
        { status: 400 }
      );
    }

    // Get student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, profile_id')
      .eq('profile_id', session.userId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student record not found. Please ensure you are registered as a student.' },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const fileExt = imageData.split(';')[0].split('/')[1];
    const fileName = `certificate-${student.id}.${fileExt}`;
    const filePath = `certificates/${fileName}`;

    // Upload to Supabase Storage (use admin client for server-side uploads)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile_img') // Using same bucket as profile images
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Error uploading certificate image:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('profile_img')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update student record with certificate image URL
    const { error: updateStudentError } = await supabaseAdmin
      .from('students')
      .update({ certificate_image_url: publicUrl })
      .eq('id', student.id);

    if (updateStudentError) {
      console.error('Error updating student with certificate image URL:', updateStudentError);
      return NextResponse.json(
        { error: 'Failed to update student record', details: updateStudentError.message },
        { status: 500 }
      );
    }

    // Optionally sync to profile picture if requested
    if (useAsProfilePicture) {
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', session.userId);

      if (updateProfileError) {
        console.error('Error updating profile with certificate image:', updateProfileError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        certificateImageUrl: publicUrl,
        profilePictureUrl: useAsProfilePicture ? publicUrl : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in certificate image upload API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

/**
 * Delete certificate image (optional)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = requireStudent(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, certificate_image_url')
      .eq('profile_id', session.userId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    // Remove certificate image URL from student record
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ certificate_image_url: null })
      .eq('id', student.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove certificate image', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting certificate image:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}


