import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { containsXSS } from '@/lib/input-security';

// Security constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILENAME_LENGTH = 255;

/**
 * Upload event image
 * POST /api/events/upload-image
 * Body: { imageData: string (base64) }
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageData } = await req.json();

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

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Security: Generate safe filename (prevent path traversal)
    const fileExt = imageType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const safeFileName = `event-${timestamp}-${randomStr}.${fileExt}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Security: Validate filename length
    if (safeFileName.length > MAX_FILENAME_LENGTH) {
      return NextResponse.json(
        { error: 'Generated filename is too long' },
        { status: 400 }
      );
    }
    
    // Upload to Supabase Storage (use admin client for server-side uploads)
    // Try dedicated 'events' bucket first, fallback to 'profile_img' if it doesn't exist
    let bucketName = 'events';
    let filePath = safeFileName; // Store directly in events bucket root
    let uploadData, uploadError;
    
    ({ data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace if exists
      }));

    // If events bucket doesn't exist, fallback to profile_img bucket with events/ folder
    if (uploadError && uploadError.message?.includes('Bucket not found')) {
      console.log('Events bucket not found, using profile_img bucket with events/ folder');
      bucketName = 'profile_img';
      filePath = `events/${safeFileName}`;
      ({ data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        }));
    }

    if (uploadError) {
      console.error('Error uploading event image:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    return NextResponse.json(
      { 
        success: true, 
        imageUrl: publicUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in event image upload API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

