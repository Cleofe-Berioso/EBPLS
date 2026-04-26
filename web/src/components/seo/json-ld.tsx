'use client';

import { useEffect, useState } from 'react';

/**
 * JSON-LD Structured Data Components
 * GovernmentService, FAQPage, BreadcrumbList schemas
 */

export interface JsonLdProps {
  data: Record<string, unknown>;
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Escape </script> sequences to prevent script-tag injection breakout
  const safeJson = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
      suppressHydrationWarning
    />
  );
}

// ============================================================================
// GovernmentService Schema
// ============================================================================

export function GovernmentServiceSchema() {
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000';

  return (
    <JsonLd
      id="schema-government-service"
      data={{
        '@context': 'https://schema.org',
        '@type': 'GovernmentService',
        name: 'Online Business Permit Application System',
        description:
          'Apply for, renew, and claim your business permit online through the Local Government Unit portal.',
        serviceType: 'Business Permit Application',
        provider: {
          '@type': 'GovernmentOrganization',
          name: process.env.LGU_NAME || 'Local Government Unit',
          address: {
            '@type': 'PostalAddress',
            addressLocality: process.env.LGU_CITY || 'City',
            addressRegion: process.env.LGU_PROVINCE || 'Province',
            addressCountry: 'PH',
          },
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: process.env.LGU_NAME || 'Local Government Unit',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'PH',
          },
        },
        url: appUrl,
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceUrl: `${appUrl}/dashboard/applications/new`,
          serviceSmsNumber: process.env.LGU_SMS_NUMBER || '',
          servicePhone: process.env.LGU_PHONE || '',
        },
      }}
    />
  );
}

// ============================================================================
// FAQPage Schema
// ============================================================================

export function FAQPageSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      id="schema-faq-page"
      data={{
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
      }}
    />
  );
}

// ============================================================================
// BreadcrumbList Schema
// ============================================================================

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000';

  return (
    <JsonLd
      id="schema-breadcrumb"
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http') ? item.url : `${appUrl}${item.url}`,
        })),
      }}
    />
  );
}

// ============================================================================
// Organization Schema
// ============================================================================

export function OrganizationSchema() {
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000';

  return (
    <JsonLd
      id="schema-organization"
      data={{
        '@context': 'https://schema.org',
        '@type': 'GovernmentOrganization',
        name: process.env.LGU_NAME || 'Local Government Unit',
        url: appUrl,
        logo: `${appUrl}/logo.png`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: process.env.LGU_ADDRESS || 'Municipal/City Hall',
          addressLocality: process.env.LGU_CITY || 'City',
          addressRegion: process.env.LGU_PROVINCE || 'Province',
          postalCode: process.env.LGU_ZIP || '0000',
          addressCountry: 'PH',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: process.env.LGU_PHONE || '',
          contactType: 'customer service',
          availableLanguage: ['English', 'Filipino'],
        },
      }}
    />
  );
}

// ============================================================================
// WebApplication Schema
// ============================================================================

export function WebApplicationSchema() {
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000';

  return (
    <JsonLd
      id="schema-web-application"
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Online Business Permit System',
        url: appUrl,
        applicationCategory: 'GovernmentApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'PHP',
          description: 'Free online business permit application',
        },
        featureList: [
          'Online business permit application',
          'Document upload and verification',
          'Real-time application tracking',
          'Online payment (GCash, Maya)',
          'Claim scheduling',
          'Permit PDF download',
        ],
      }}
    />
  );
}
