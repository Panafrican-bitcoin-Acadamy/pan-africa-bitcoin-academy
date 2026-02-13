import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { secureEmailInput } from '@/lib/security-utils';
import { containsXSS } from '@/lib/input-security';

// Security constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILENAME_LENGTH = 255;

export async function POST(req: NextRequest) {
  try {
    const { email, imageData } = await req.json();

    // Security: Validate email
    const emailValidation = secureEmailInput(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Security: Check for XSS in image data
    if (containsXSS(imageData)) {
      return NextResponse.json(
        { error: 'Invalid image data format' },
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

    if (imageSizeInBytes > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit. Please upload a smaller image.` },
        { status: 400 }
      );
    }

    // Security: Validate minimum image size (prevent empty/invalid images)
    if (imageSizeInBytes < 100) {
      return NextResponse.json(
        { error: 'Image file is too small or invalid' },
        { status: 400 }
      );
    }

    // Validate image type
    const imageType = imageData.split(';')[0].split(':')[1];
    if (!imageType || !ALLOWED_IMAGE_TYPES.includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please upload JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    // Security: Validate base64 data format
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(base64Data)) {
      return NextResponse.json(
        { error: 'Invalid image data encoding' },
        { status: 400 }
      );
    }

    // Get profile to get the ID (use validated email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailValidation.normalized!)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Convert base64 to buffer (already extracted above for validation)
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Security: Generate safe filename (prevent path traversal)
    const fileExt = imageType.split('/')[1] || 'jpg';
    const safeFileName = `${profile.id}.${fileExt}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Security: Validate filename length
    if (safeFileName.length > MAX_FILENAME_LENGTH) {
      return NextResponse.json(
        { error: 'Generated filename is too long' },
        { status: 400 }
      );
    }
    
    const filePath = `profiles/${safeFileName}`;

    // Upload to Supabase Storage (use admin client for server-side uploads)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile_img')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
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

    // Update profile with image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile with image URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, photoUrl: publicUrl },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in image upload API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

