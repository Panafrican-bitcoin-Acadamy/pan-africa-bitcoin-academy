/**
 * Structured data (JSON-LD) generators for SEO
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PanAfrican Bitcoin Academy',
  alternateName: 'Pan-African Bitcoin Academy',
  url: baseUrl,
  logo: `${baseUrl}/icon.svg`,
  description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Clear lessons, real security, and developer pathways.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'ER', // Eritrea
  },
  sameAs: [
    // Add social media links when available
    // 'https://twitter.com/panafricanbitcoin',
    // 'https://facebook.com/panafricanbitcoin',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Educational Support',
    email: 'info@panafricanbitcoin.com', // Update with actual email
  },
};

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PanAfrican Bitcoin Academy',
  url: baseUrl,
  description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Clear lessons, real security, and developer pathways.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/chapters?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${baseUrl}${article.url}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author || 'PanAfrican Bitcoin Academy',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PanAfrican Bitcoin Academy',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.svg`,
      },
    },
    image: article.image ? `${baseUrl}${article.image}` : `${baseUrl}/og-image.png`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${article.url}`,
    },
  };
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

export function generateCourseStructuredData(course: {
  name: string;
  description: string;
  url: string;
  provider: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.provider,
      url: baseUrl,
    },
    url: `${baseUrl}${course.url}`,
  };
}

