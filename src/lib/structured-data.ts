/**
 * Structured data (JSON-LD) generators for SEO
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'PanAfrican Bitcoin Academy',
  alternateName: ['Pan-African Bitcoin Academy', 'Eritrea Bitcoin Academy', 'Uganda Bitcoin Academy', 'Africa Bitcoin Academy'],
  url: baseUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${baseUrl}/images/logo_3.png`,
    width: 512,
    height: 512,
    caption: 'Pan-African Bitcoin Academy Logo - First Eritrea Based Bitcoin Academy serving Eritrea, Uganda, and Africa',
  },
  image: {
    '@type': 'ImageObject',
    url: `${baseUrl}/images/bitcoin-bg.jpg`,
    caption: 'Bitcoin education background - PanAfrican Bitcoin Academy for Eritrea, Uganda, and Africa',
  },
  description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education in Eritrea, Uganda, and across Africa. Convert Bitcoin to Nakfa, join Eritrean Bitcoiners community. Serving Asmara, Kampala, and communities across East Africa.',
  address: [
    {
      '@type': 'PostalAddress',
      addressCountry: 'ER', // Eritrea
      addressLocality: 'Asmara',
      addressRegion: 'Maekel',
    },
    {
      '@type': 'PostalAddress',
      addressCountry: 'UG', // Uganda
      addressLocality: 'Kampala',
    },
  ],
  areaServed: [
    {
      '@type': 'Country',
      name: 'Eritrea',
    },
    {
      '@type': 'Country',
      name: 'Uganda',
    },
    {
      '@type': 'Continent',
      name: 'Africa',
    },
  ],
  keywords: 'Bitcoin education, Eritrea Bitcoin, Uganda Bitcoin, Africa Bitcoin, Bitcoin Nakfa, Bitcoin Asmara, Bitcoin Kampala, Eritrean Bitcoiners, African Bitcoin education, East Africa Bitcoin',
  sameAs: [
    'https://github.com/Joie199/pan-africa-bitcoin-academy',
    'https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji',
    'https://jumble.social/users/npub1q659nzy6j3mn8nr8ljznzumplesd40276tefj6gjz72npmqqg5cqmh70vv',
    'https://discord.gg/4G4TUAP7',
    'https://www.facebook.com/profile.php?id=61586743276906',
    'https://x.com/panafricanbtc',
    'https://www.instagram.com/panafricanbitcoin/',
    'https://www.tiktok.com/@panafricanbitcoin',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Educational Support',
    email: 'info@panafricanbitcoin.com', // Update with actual email
    areaServed: ['ER', 'UG', 'Africa'],
  },
};

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PanAfrican Bitcoin Academy',
  alternateName: ['Eritrea Bitcoin Academy', 'Uganda Bitcoin Academy', 'Africa Bitcoin Education'],
  url: baseUrl,
  description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education in Eritrea, Uganda, and across Africa. Convert Bitcoin to Nakfa, join Eritrean Bitcoiners community. Serving Asmara, Kampala, and communities across East Africa.',
  keywords: 'Bitcoin education Eritrea, Bitcoin education Uganda, Bitcoin education Africa, Eritrea Bitcoin academy, Uganda Bitcoin academy, Africa Bitcoin academy, Bitcoin Nakfa, Bitcoin Asmara, Bitcoin Kampala',
  inLanguage: 'en',
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
        url: `${baseUrl}/images/logo_3.png`,
        width: 512,
        height: 512,
        caption: 'Pan-African Bitcoin Academy Logo',
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

