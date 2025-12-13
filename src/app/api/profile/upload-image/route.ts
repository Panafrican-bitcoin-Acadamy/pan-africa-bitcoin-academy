import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, imageData } = await req.json();

    if (!email || !imageData) {
      return NextResponse.json(
        { error: 'Email and imageData are required' },
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const imageType = imageData.split(';')[0].split(':')[1];
    if (!allowedTypes.includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please upload JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    // Get profile to get the ID
    const { data: profile, error: profileError } = await supabase
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

    // Convert base64 to buffer (already extracted above for validation)
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const fileExt = imageData.split(';')[0].split('/')[1];
    const fileName = `${profile.id}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

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


}

