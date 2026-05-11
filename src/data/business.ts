// Centralized public business identity. Keep NAP details consistent everywhere.
// Only public, explicitly-approved details are stored here.

export const business = {
  legalName: "František Kalášek",
  brandName: "TopBot PwnZ™",
  fullName: "František Kalášek / TopBot PwnZ™",
  ico: "23628588",
  legalForm: "Fyzická osoba podnikající dle živnostenského zákona",
  tradeName:
    "Výroba, obchod a služby neuvedené v přílohách 1 až 3 živnostenského zákona",
  tradeType: "Ohlašovací volná živnost",
  tradeStartedAt: "21. 8. 2025",
  tradeValidity: "na dobu neurčitou",
  tradeAuthority: "Městský úřad Nové Město na Moravě",
  dataBoxId: "v2328bu",
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
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=Javorek%2054%2C%20592%2003%20Javorek%2C%20%C4%8Cesko",
    mapEmbedSrc:
      "https://www.google.com/maps?q=Javorek%2054%2C%20592%2003%20Javorek%2C%20%C4%8Cesko&output=embed",
  },
  registeredOffice: {
    label: "Sídlo dle živnostenského rejstříku",
    line1: "Daňkovice 9",
    postalCode: "592 03",
    city: "Daňkovice",
    country: "Česko",
    countryCode: "CZ",
    full: "Daňkovice 9, 592 03 Daňkovice, Česko",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=Da%C5%88kovice%209%2C%20592%2003%20Da%C5%88kovice%2C%20%C4%8Cesko",
  },
  description:
    "František Kalášek / TopBot PwnZ™ navrhuje a realizuje webové aplikace, PWA, automatizace, API integrace, cloudová a self-hosted řešení a technologické konzultace. Důraz je na praktický výsledek, srozumitelný postup, provozní stabilitu a dlouhodobou udržitelnost.",
  shortDescription:
    "Webové aplikace, PWA, automatizace, API integrace a technická řešení pro srozumitelnější provoz firmy.",
  supportingText:
    "Spojuji technický návrh, praktický provoz a moderní digitální nástroje do řešení, která mají jasný účel a dají se dál rozvíjet.",
  focus: [
    "vývoj webových aplikací",
    "PWA řešení",
    "automatizace",
    "API integrace",
    "cloudová a self-hosted řešení",
    "IT / technologické konzultace",
    "zpracování dat",
    "hostingové činnosti a webové portály",
    "digitální poradenství",
    "marketing a mediální zastoupení",
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
