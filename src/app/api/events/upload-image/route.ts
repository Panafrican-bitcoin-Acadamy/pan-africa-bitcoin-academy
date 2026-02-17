import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { containsXSS } from '@/lib/input-security';
import crypto from 'crypto';

// Security constants
const MIN_IMAGE_SIZE = 100; // 100 bytes minimum (for security - prevent empty/invalid images)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILENAME_LENGTH = 255;
const MAX_IMAGE_DIMENSIONS = { width: 10000, height: 10000 };
const MIN_IMAGE_DIMENSIONS = { width: 100, height: 100 };

/**
 * Upload event image
 * POST /api/events/upload-image
 * Body: { imageData: string (base64) }
 */
export async function POST(req: NextRequest) {
  let session: { adminId: string; email: string } | null = null;
  try {
    session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageData, fileName, altText } = await req.json();

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Log upload attempt
    console.log('[Image Upload] Attempt:', {
      adminId: session.adminId,
      adminEmail: session.email,
      fileName: fileName || 'unknown',
      timestamp: new Date().toISOString(),
    });

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

    // Convert base64 to buffer and check minimum size
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageSizeInBytes = (base64Data.length * 3) / 4;

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
    
    // Basic image validation - check magic bytes (file signature)
    const isValidImage = validateImageSignature(buffer, imageType);
    if (!isValidImage) {
      console.warn('[Image Upload] Invalid image signature detected:', {
        adminEmail: session.email,
        fileName: fileName || 'unknown',
        declaredType: imageType,
      });
      return NextResponse.json(
        { error: 'Invalid image file. File type does not match content.' },
        { status: 400 }
      );
    }

    // Log image upload attempt
    console.log('[Image Upload] Image validated:', {
      adminId: session.adminId,
      adminEmail: session.email,
      fileName: fileName || 'unknown',
      fileSize: buffer.length,
      fileType: imageType,
      timestamp: new Date().toISOString(),
    });
    
    // Security: Generate safe filename with hash for duplicate prevention
    const fileExt = imageType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const safeFileName = `event-${timestamp}-${hash}-${randomStr}.${fileExt}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    
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

    // Log successful upload
    console.log('[Image Upload] Success:', {
      adminId: session.adminId,
      adminEmail: session.email,
      fileName: safeFileName,
      filePath: filePath,
      imageUrl: publicUrl,
      fileSize: buffer.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        success: true, 
        imageUrl: publicUrl,
        fileName: safeFileName,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Image Upload] Error:', {
      adminId: session?.adminId,
      adminEmail: session?.email,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
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
 * Validate image file signature (magic bytes) to prevent file type spoofing
 */
function validateImageSignature(buffer: Buffer, declaredType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (declaredType.includes('jpeg') || declaredType.includes('jpg')) {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (declaredType.includes('png')) {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (declaredType.includes('gif')) {
    return (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38);
  }

  // WebP: RIFF...WEBP
  if (declaredType.includes('webp')) {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }

  return false;
}

