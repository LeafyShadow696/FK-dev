// Centralized public business identity. Keep NAP details consistent everywhere.
// Only public, explicitly-approved details are stored here.

export const business = {
  legalName: "František Kalášek",
  brandName: "TopBot PwnZ™",
  fullName: "František Kalášek / TopBot PwnZ™",
  motto: "Bridge the gap, create the world.",
  domain: "fkdev.xyz",
  url: "https://fkdev.xyz",
  email: "FandaKalasek@icloud.com",
  emailHref:
    "mailto:FandaKalasek@icloud.com?subject=Popt%C3%A1vka%20projektu%20z%20fkdev.xyz&body=Dobr%C3%BD%20den%2C%0A%0Am%C3%A1m%20z%C3%A1jem%20o%20konzultaci%20nebo%20realizaci%20projektu.%0A%0ATyp%20projektu%3A%20%0ARozsah%20%2F%20zad%C3%A1n%C3%AD%3A%20%0ATerm%C3%ADn%3A%20%0ARozpo%C4%8Det%20orienta%C4%8Dn%C4%9B%3A%20%0A%0AKontakt%3A%20%0A%0AD%C4%9Bkuji.",
  phone: "+420 722 426 195",
  phoneHref: "tel:+420722426195",
  address: {
    label: "Kontaktní adresa",
    line1: "Javorek 54",
    postalCode: "592 03",
    city: "Javorek",
    country: "Česko",
    countryCode: "CZ",
    full: "Javorek 54, 592 03 Javorek, Česko",
  },
  description:
    "František Kalášek / TopBot PwnZ™ se zaměřuje na vývoj webových aplikací, PWA řešení, automatizací, API integrací, cloudových a self-hosted systémů a technologických konzultací. Cílem je vytvářet funkční, profesionální a dlouhodobě udržitelná digitální řešení.",
  shortDescription:
    "Prémiová tvorba webových aplikací, PWA řešení, automatizací, API integrací a moderních digitálních systémů.",
  supportingText:
    "Spojuji technické řešení, praktické podnikání a moderní digitální nástroje do funkčních systémů připravených pro dlouhodobé používání.",
  focus: [
    "vývoj webových aplikací",
    "PWA řešení",
    "automatizace",
    "API integrace",
    "cloudová a self-hosted řešení",
    "IT / technologické konzultace",
    "digitální poradenství",
    "technická podpora",
    "školení",
  ],
  technologies: [
    "React",
    "TypeScript",
    "Python",
    "APIs",
    "PWA",
    "Cloud",
    "Linux",
    "Docker",
    "Self-hosted",
    "Automation",
    "Data processing",
    "Web portals",
  ],
  languages: ["cs", "en"],
} as const

export type Business = typeof business
