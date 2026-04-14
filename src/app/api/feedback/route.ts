import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_COMMENT = 2000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ratingRaw = body?.rating;
    const commentRaw = body?.comment;
    const pagePathRaw = body?.page_path;
    const honeypot = body?.website;

    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return NextResponse.json({ ok: true, message: 'Thanks for your feedback!' }, { status: 201 });
    }

    const rating = typeof ratingRaw === 'number' ? ratingRaw : parseInt(String(ratingRaw), 10);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Please choose a rating from 1 to 5 stars.' }, { status: 400 });
    }

    let comment: string | null = null;
    if (commentRaw != null && String(commentRaw).trim() !== '') {
      const t = String(commentRaw).trim().slice(0, MAX_COMMENT);
      comment = t.length > 0 ? t : null;
    }

    let page_path = '/';
    if (typeof pagePathRaw === 'string' && pagePathRaw.trim() !== '') {
      const p = pagePathRaw.trim().slice(0, 512);
      if (p.startsWith('/')) page_path = p;
    }

    const { error } = await supabaseAdmin.from('site_feedback').insert({
      rating,
      comment,
      page_path,
    });

    if (error) {
      console.error('[Feedback] Insert error:', error);
      return NextResponse.json({ error: 'Could not save feedback. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Thanks — we appreciate your feedback!' }, { status: 201 });
  } catch (e) {
    console.error('[Feedback]', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
