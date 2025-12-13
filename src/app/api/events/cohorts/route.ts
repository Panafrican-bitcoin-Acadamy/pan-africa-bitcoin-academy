import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Get available cohorts for event creation
 * Returns list of cohorts that can be selected when creating events
 */
export async function GET() {
  try {
    // Fetch all active cohorts
    const { data: cohorts, error } = await supabase
      .from('cohorts')
      .select('id, name, status, level, start_date')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching cohorts:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch cohorts',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    // Format cohorts for selection
    const formattedCohorts = (cohorts || []).map((cohort: any) => ({
      id: cohort.id,
      name: cohort.name,
      status: cohort.status,
      level: cohort.level,
      startDate: cohort.start_date,
      label: `${cohort.name}${cohort.level ? ` (${cohort.level})` : ''}${cohort.status ? ` - ${cohort.status}` : ''}`,
    }));

    return NextResponse.json(
      {
        cohorts: formattedCohorts,
        count: formattedCohorts.length,
        // Add "For All" option
        options: [
          {
            id: 'for_all',
            name: 'For Everyone',
            label: 'For Everyone (All Users)',
            isForAll: true,
          },
          ...formattedCohorts.map((c: any) => ({
            ...c,
            isForAll: false,
          })),
        ],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in cohorts API:', error);
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
}



