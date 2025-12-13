import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch sats rewards grouped by student with profile names
    const { data: rewards, error } = await supabase
      .from('sats_rewards')
      .select(`
        student_id,
        amount_paid,
        profiles (
          id,
          name
        )
      `);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch leaderboard',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    // Aggregate sats by student
    const studentSats: Record<string, { name: string; sats: number }> = {};

    (rewards || []).forEach((reward: any) => {
      const studentId = reward.student_id;
      const profile = reward.profiles || {};
      const name = profile.name || 'Unknown';
      const sats = reward.amount_paid || 0;

      if (!studentSats[studentId]) {
        studentSats[studentId] = { name, sats: 0 };
      }
      studentSats[studentId].sats += sats;
    });

    // Convert to array and sort by sats (descending)
    const leaderboard = Object.entries(studentSats)
      .map(([studentId, data]) => ({
        studentId,
        name: data.name,
        sats: data.sats,
      }))
      .sort((a, b) => b.sats - a.sats)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error: any) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}


      { status: 500 }
    );
  }
}

