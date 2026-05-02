import { business } from "@/data/business"

export function buildProfessionalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: business.fullName,
    legalName: business.legalName,
    url: business.url,
    email: business.email,
    telephone: business.phone.replace(/\s+/g, ""),
    description:
      "Vývoj webových aplikací, PWA řešení, automatizací, API integrací, cloudových a self-hosted systémů a technologické konzultace.",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.line1,
      postalCode: business.address.postalCode.replace(/\s+/g, ""),
      addressLocality: business.address.city,
      addressCountry: business.address.countryCode,
    },
    areaServed: "Czech Republic",
    availableLanguage: business.languages,
  } as const
}
