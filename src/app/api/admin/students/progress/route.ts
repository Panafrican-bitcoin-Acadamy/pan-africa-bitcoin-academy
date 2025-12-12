import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profiles with students and chapter_progress relationships
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        status,
        students:students(id, cohort_id, created_at),
        chapter_progress:chapter_progress(is_completed, is_unlocked)
      `)
      .limit(200);

    if (error) {
      throw error;
    }

    const progress = (profiles || []).map((p: any) => {
      const chapterData = p.chapter_progress || [];
      const completed = chapterData.filter((c: any) => c.is_completed).length;
      const unlocked = chapterData.length;
      return {
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unnamed',
        email: p.email,
        status: p.status,
        cohortId: p.students?.[0]?.cohort_id || null,
        studentId: p.students?.[0]?.id || null,
        completedChapters: completed,
        unlockedChapters: unlocked,
      };
    });

    const res = NextResponse.json({ progress }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in admin students progress API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}

