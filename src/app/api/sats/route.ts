import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Sum all sats rewards
    const { data: rewards, error } = await supabase
      .from('sats_rewards')
      .select('amount_paid, amount_pending');

    if (error) {
      console.error('Error fetching sats rewards:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch sats',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalPaid = (rewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_paid || 0),
      0
    );
    const totalPending = (rewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_pending || 0),
      0
    );

    return NextResponse.json(
      { totalPaid, totalPending },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in sats API:', error);
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

