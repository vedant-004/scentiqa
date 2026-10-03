// Server-safe SEO helpers: JSON-LD structured data builders.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Scentiqa',
    url: 'https://scentiqa.in',
    slogan: 'Independent dupe lab, verified INR prices and climate-tested reviews for India.',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Scentiqa',
    url: 'https://scentiqa.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://scentiqa.in/find-alternative?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  };
}
