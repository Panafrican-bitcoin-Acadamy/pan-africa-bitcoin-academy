import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { validateAndNormalizeEmail } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * POST /api/admin/create
 * Create a new admin account
 * Requires authentication and admin privileges
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

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      position,
      accessLevel,
      phone,
      country,
      city,
      notes,
      temporaryPassword,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Validate and normalize email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.normalized;

    // Check if admin with this email already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing admin:', checkError);
      return NextResponse.json(
        { error: 'Database error while checking existing admin' },
        { status: 500 }
      );
    }

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 }
      );
    }

    // Generate temporary password if not provided
    let passwordToHash: string;
    if (temporaryPassword && temporaryPassword.trim()) {
      passwordToHash = temporaryPassword.trim();
    } else {
      // Generate a secure random password
      passwordToHash = crypto.randomBytes(16).toString('hex');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    // Prepare admin data
    const adminData: any = {
      email: normalizedEmail,
      password_hash: passwordHash,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role: accessLevel || 'standard', // Use accessLevel for role
      email_verified: true, // Auto-verify since admin is creating it
      force_password_change: true, // Require password change on first login
      password_changed_at: null, // Will be set when they change password
    };

    // Add optional fields if provided
    if (position) adminData.position = position.trim();
    if (accessLevel) {
      adminData.access_level = accessLevel;
      adminData.role = accessLevel; // Also set role to accessLevel for compatibility
    }
    if (phone) adminData.phone = phone.trim();
    if (country) adminData.country = country.trim();
    if (city) adminData.city = city.trim();
    if (notes) adminData.notes = notes.trim();
    if (session.adminId) adminData.created_by = session.adminId;

    // Insert new admin
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admins')
      .insert(adminData)
      .select('id, email, first_name, last_name, position, access_level, created_at')
      .single();

    if (insertError) {
      console.error('Error creating admin:', insertError);
      return NextResponse.json(
        { error: 'Failed to create admin account', details: insertError.message },
        { status: 500 }
      );
    }

    // Return success with the temporary password (only if it was auto-generated)
    return NextResponse.json({
      success: true,
      admin: newAdmin,
      temporaryPassword: !temporaryPassword ? passwordToHash : undefined, // Only return if auto-generated
      message: temporaryPassword 
        ? 'Admin account created successfully. They can now log in with the provided password.'
        : 'Admin account created successfully. Please share the temporary password with them.',
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}

