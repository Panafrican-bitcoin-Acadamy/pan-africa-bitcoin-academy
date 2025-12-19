import { NextRequest, NextResponse } from 'next/server';
import { chaptersContent } from '@/content/chaptersContent';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase().trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];

    // Search chapters
    chaptersContent.forEach((chapter) => {
      const searchText = [
        chapter.title,
        chapter.hook,
        ...chapter.learn,
        ...chapter.summary,
        ...chapter.keyTerms,
        ...chapter.sections.flatMap(section => [
          section.heading,
          ...(section.paragraphs || []),
          ...(section.bullets || []),
          ...(section.callouts?.map(c => c.content) || [])
        ])
      ].join(' ').toLowerCase();

      if (searchText.includes(query)) {
        // Find matching sections
        const matchingSections = chapter.sections.filter(section => {
          const sectionText = [
            section.heading,
            ...(section.paragraphs || []),
            ...(section.bullets || [])
          ].join(' ').toLowerCase();
          return sectionText.includes(query);
        });

        if (matchingSections.length > 0) {
          matchingSections.forEach(section => {
            const excerpt = section.paragraphs?.[0]?.substring(0, 150) || section.heading;
            results.push({
              type: 'Chapter',
              icon: '📚',
              title: `${chapter.number}. ${chapter.title} - ${section.heading}`,
              excerpt: excerpt.length > 150 ? excerpt + '...' : excerpt,
              url: `/chapters/${chapter.slug}`,
              chapterNumber: chapter.number,
            });
          });
        } else {
          // General chapter match
          results.push({
            type: 'Chapter',
            icon: '📚',
            title: `Chapter ${chapter.number}: ${chapter.title}`,
            excerpt: chapter.hook.substring(0, 150),
            url: `/chapters/${chapter.slug}`,
            chapterNumber: chapter.number,
          });
        }
      }
    });

    // Search blog posts (if API exists)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      
      const blogResponse = await fetch(`${baseUrl}/api/blog?search=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });

      if (blogResponse.ok) {
        const blogData = await blogResponse.json();
        if (blogData.posts && Array.isArray(blogData.posts)) {
          blogData.posts.forEach((post: any) => {
            results.push({
              type: 'Blog',
              icon: '📝',
              title: post.title,
              excerpt: post.excerpt || post.content?.substring(0, 150) || '',
              url: `/blog/${post.slug || post.id}`,
            });
          });
        }
      }
    } catch (error) {
      // Blog search is optional, continue without it
      console.log('Blog search unavailable:', error);
    }

    // Search static pages
    const staticPages = [
      {
        title: 'About',
        description: 'Learn about Pan-African Bitcoin Academy, our mission, and our commitment to Bitcoin education across Africa.',
        url: '/about',
        type: 'Page',
        icon: 'ℹ️',
        keywords: ['about', 'mission', 'academy', 'education', 'bitcoin', 'africa', 'pan-african']
      },
      {
        title: 'Impact',
        description: 'See the impact of our Bitcoin education program: students trained, sats rewarded, countries represented, and success stories.',
        url: '/impact',
        type: 'Page',
        icon: '📊',
        keywords: ['impact', 'students', 'sats', 'rewards', 'testimonials', 'success', 'statistics', 'metrics']
      },
      {
        title: 'Mentorship',
        description: 'Apply for our mentorship program and get guidance from experienced Bitcoin developers and educators.',
        url: '/mentorship',
        type: 'Page',
        icon: '👥',
        keywords: ['mentorship', 'mentor', 'guidance', 'apply', 'program', 'developers', 'educators']
      },
      {
        title: 'Developer Hub',
        description: 'Resources and tools for Bitcoin developers: APIs, documentation, tutorials, and developer resources.',
        url: '/developer-hub',
        type: 'Page',
        icon: '💻',
        keywords: ['developer', 'hub', 'api', 'documentation', 'tutorials', 'resources', 'tools', 'code']
      },
      {
        title: 'Donate',
        description: 'Support Bitcoin education in Africa by donating Bitcoin. Help us train more students and expand our impact.',
        url: '/donate',
        type: 'Page',
        icon: '💰',
        keywords: ['donate', 'donation', 'support', 'bitcoin', 'contribute', 'funding', 'sponsor']
      },
      {
        title: 'FAQ',
        description: 'Frequently asked questions about the academy, courses, applications, and Bitcoin education.',
        url: '/faq',
        type: 'Page',
        icon: '❓',
        keywords: ['faq', 'questions', 'answers', 'help', 'support', 'common', 'frequently asked']
      },
      {
        title: 'Apply',
        description: 'Apply to join the Pan-African Bitcoin Academy. Start your Bitcoin education journey today.',
        url: '/apply',
        type: 'Page',
        icon: '📝',
        keywords: ['apply', 'application', 'join', 'enroll', 'register', 'sign up', 'admission']
      },
      {
        title: 'Chapters',
        description: 'Browse all learning chapters covering Bitcoin fundamentals, technical concepts, and practical applications.',
        url: '/chapters',
        type: 'Page',
        icon: '📚',
        keywords: ['chapters', 'lessons', 'courses', 'learning', 'curriculum', 'education', 'tutorials']
      },
      {
        title: 'Blog',
        description: 'Read articles, essays, and stories from students, graduates, and the Bitcoin community.',
        url: '/blog',
        type: 'Page',
        icon: '📝',
        keywords: ['blog', 'articles', 'essays', 'stories', 'posts', 'writing', 'community']
      },
      {
        title: 'Dashboard',
        description: 'Student dashboard: track your progress, view assignments, see your stats, and manage your learning.',
        url: '/dashboard',
        type: 'Page',
        icon: '📊',
        keywords: ['dashboard', 'progress', 'assignments', 'stats', 'student', 'profile', 'track']
      }
    ];

    staticPages.forEach(page => {
      const pageText = [
        page.title,
        page.description,
        ...page.keywords
      ].join(' ').toLowerCase();

      if (pageText.includes(query)) {
        results.push({
          type: page.type,
          icon: page.icon,
          title: page.title,
          excerpt: page.description,
          url: page.url,
        });
      }
    });

    // Sort results: chapters first, then pages, then blog posts
    results.sort((a, b) => {
      const order = { 'Chapter': 1, 'Page': 2, 'Blog': 3 };
      const aOrder = order[a.type as keyof typeof order] || 99;
      const bOrder = order[b.type as keyof typeof order] || 99;
      return aOrder - bOrder;
    });

    // Limit results
    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}
