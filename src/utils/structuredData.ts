import { business } from "@/data/business"

export function buildProfessionalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${business.url}/#business`,
    name: business.fullName,
    legalName: business.legalName,
    identifier: business.ico,
    taxID: business.ico,
    foundingDate: "2025-08-21",
    url: business.url,
    email: business.email,
    telephone: business.phone.replace(/\s+/g, ""),
    description:
      "Vývoj webových aplikací, PWA řešení, automatizací, API integrací, cloudových a self-hosted systémů a technologické konzultace.",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.registeredOffice.line1,
      postalCode: business.registeredOffice.postalCode.replace(/\s+/g, ""),
      addressLocality: business.registeredOffice.city,
      addressCountry: business.registeredOffice.countryCode,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: business.email,
      telephone: business.phone.replace(/\s+/g, ""),
      availableLanguage: business.languages,
    },
    areaServed: {
      "@type": "Country",
      name: "Czech Republic",
    },
    availableLanguage: business.languages,
  } as const
}
