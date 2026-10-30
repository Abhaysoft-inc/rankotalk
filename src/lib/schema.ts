import { SITE } from '../config';

type Crumb = { name: string; url: string };
type Faq = { q: string; a: string };

export const breadcrumbLd = (items: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});

export const faqLd = (faqs: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const webAppLd = (opts: { name: string; url: string; description: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: opts.name,
  url: opts.url,
  description: opts.description,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  inLanguage: SITE.locale,
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  publisher: { '@type': 'Organization', name: SITE.name },
});

export const articleLd = (opts: {
  title: string;
  description: string;
  url: string;
  published: string;
  modified: string;
  image: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: opts.title,
  description: opts.description,
  mainEntityOfPage: opts.url,
  datePublished: opts.published,
  dateModified: opts.modified,
  image: opts.image,
  inLanguage: SITE.locale,
  author: { '@type': 'Person', name: SITE.authorName },
  publisher: { '@type': 'Organization', name: SITE.name },
});

export const websiteLd = (url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url,
  inLanguage: SITE.locale,
});

export const orgLd = (url: string, logo: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url,
  logo,
});
