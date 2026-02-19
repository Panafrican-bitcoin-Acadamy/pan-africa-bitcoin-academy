import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

/**
 * POST /api/admin/email-verification/send
 * Send email verification email to admin
 * Requires authentication
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin details
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, email_verified')
      .eq('id', session.adminId)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (admin.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        email_verification_token: verificationToken,
        email_verification_token_expiry: tokenExpiry.toISOString(),
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error storing verification token:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate verification token' },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationEmail({
      userName: admin.email.split('@')[0],
      userEmail: admin.email,
      verificationToken,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
    });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

