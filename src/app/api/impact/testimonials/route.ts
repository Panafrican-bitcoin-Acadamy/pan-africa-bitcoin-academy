import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API endpoint to fetch approved student testimonials
 * Returns testimonials with student profile information (name, city, country, photo_url)
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch approved testimonials
    const { data: testimonials, error: testimonialsError } = await supabaseAdmin
      .from('student_testimonials')
      .select('id, testimonial, rating, display_order, is_featured, created_at, student_id')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10); // Limit to 10 testimonials

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    if (!testimonials || testimonials.length === 0) {
      return NextResponse.json({
        testimonials: [],
      });
    }

    // Fetch profile data for all students
    const studentIds = testimonials.map((t: any) => t.student_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, city, country, photo_url')
      .in('id', studentIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch student profiles' },
        { status: 500 }
      );
    }

    // Create a map of student_id to profile for quick lookup
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Transform the data to match the expected format
    const formattedTestimonials = testimonials.map((testimonial: any) => {
      const profile = profileMap.get(testimonial.student_id) || {};
      
      // Format location: "City, Country" or just "Country" if no city
      let location = '';
      if (profile.city && profile.country) {
        location = `${profile.city}, ${profile.country}`;
      } else if (profile.country) {
        location = profile.country;
      } else if (profile.city) {
        location = profile.city;
      }

      return {
        id: testimonial.id,
        name: profile.name || 'Anonymous',
        city: location,
        quote: testimonial.testimonial,
        rating: testimonial.rating || 5,
        photo: profile.photo_url || null,
      };
    });

    return NextResponse.json({
      testimonials: formattedTestimonials,
    });
  } catch (error: any) {
    console.error('Error in testimonials API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
