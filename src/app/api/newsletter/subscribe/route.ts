import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const validation = validateAndNormalizeEmail(email);
    if (!validation.valid || !validation.normalized) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const normalizedEmail = validation.normalized;

    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      if (!existing.is_active) {
        await supabaseAdmin
          .from('newsletter_subscribers')
          .update({ is_active: true, resubscribed_at: new Date().toISOString() })
          .eq('id', existing.id);
        return NextResponse.json({ message: 'Welcome back! You have been re-subscribed.' }, { status: 200 });
      }
      return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, is_active: true });

    if (insertError) {
      console.error('[Newsletter] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully subscribed!' }, { status: 201 });
  } catch (error: any) {
    console.error('[Newsletter] Error:', error?.message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
