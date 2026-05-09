import type { LucideIcon } from "lucide-react"
import {
  Cloud,
  Code2,
  GraduationCap,
  Layers,
  LineChart,
  Server,
  Settings2,
  Workflow,
} from "lucide-react"

export interface Service {
  id: string
  title: string
  description: string
  when: string
  output: string
  example: string
  icon: LucideIcon
}

export const services: Service[] = [
  {
    id: "web-pwa",
    title: "Webové aplikace & PWA",
    description:
      "Návrh a vývoj moderních webových aplikací, responzivních rozhraní a PWA řešení připravených pro praktické používání.",
    when:
      "Hodí se, když potřebujete víc než statickou vizitku: rezervační rozhraní, klientskou zónu, interní nástroj nebo web, který má jasně vést k poptávce.",
    output:
      "Výstupem může být landing page, firemní web, PWA, administrační rozhraní, napojení na API nebo staticky nasazená aplikace.",
    example:
      "Poptávkový web s rychlým načítáním, měřením, SEO základy a jednoduchou cestou od návštěvníka ke kontaktu.",
    icon: Code2,
  },
  {
    id: "automation",
    title: "Python automatizace",
    description:
      "Automatizace opakovaných procesů, práce s daty, skripty, interní nástroje a optimalizace workflow.",
    when:
      "Hodí se, když ručně přepisujete data, exportujete tabulky, kontrolujete soubory nebo pravidelně děláte stejný technický úkon.",
    output:
      "Výstupem může být skript, interní nástroj, plánovaná úloha, datový export, validátor nebo propojení několika služeb.",
    example:
      "Automatizace, která vezme export z jednoho systému, zkontroluje ho, upraví formát a připraví data pro další použití.",
    icon: Workflow,
  },
  {
    id: "api",
    title: "API integrace",
    description:
      "Propojování systémů, externích služeb, webových aplikací a podnikových nástrojů přes API.",
    when:
      "Hodí se, když potřebujete dostat data z jednoho nástroje do druhého, odstranit ruční mezikroky nebo propojit web s externí službou.",
    output:
      "Výstupem může být integrační vrstva, webhook, synchronizace dat, import/export nebo menší backend služba.",
    example:
      "Napojení webové aplikace na e-mailing, fakturační systém, databázi, platební bránu nebo vlastní interní API.",
    icon: Layers,
  },
  {
    id: "cloud",
    title: "Cloud & self-hosted řešení",
    description:
      "Návrh, nasazení a údržba cloudových nebo self-hosted řešení s důrazem na kontrolu, bezpečnost a dlouhodobou udržitelnost.",
    when:
      "Hodí se, když řešíte hosting, doménu, DNS, zálohy, provoz aplikace nebo rozhodnutí, co má běžet v cloudu a co pod vlastní kontrolou.",
    output:
      "Výstupem může být nasazení aplikace, konfigurace domény, produkční kontrola, dokumentace provozu nebo doporučení architektury.",
    example:
      "Příprava produkčního nasazení webu včetně domény, měření, základního zabezpečení a ověření dostupnosti.",
    icon: Cloud,
  },
  {
    id: "consulting",
    title: "IT konzultace",
    description:
      "Konzultace technického řešení, výběr vhodných nástrojů, návrh architektury a praktická podpora při digitalizaci.",
    when:
      "Hodí se, když potřebujete nezávislý technický pohled před investicí, úpravou webu, výběrem nástroje nebo zadáním vývoje.",
    output:
      "Výstupem může být audit, doporučený postup, technická specifikace, prioritizace nebo vysvětlení rizik a možností.",
    example:
      "Kontrola stávajícího webu a návrh, co má největší dopad: výkon, SEO, poptávková cesta, měření nebo provozní stabilita.",
    icon: Settings2,
  },
  {
    id: "hosting",
    title: "Hosting, data & webové portály",
    description:
      "Technická příprava webových projektů, práce s daty, hostingové workflow a provoz webových portálů.",
    when:
      "Hodí se, když potřebujete dát do pořádku provoz webu, strukturu dat, exporty, jednoduchý portál nebo technické zázemí projektu.",
    output:
      "Výstupem může být provozní nastavení, datový model, portálová struktura, import/export nebo dokumentace správy.",
    example:
      "Příprava jednoduchého webového portálu s přehlednou strukturou, daty a provozním postupem pro další rozvoj.",
    icon: Server,
  },
  {
    id: "marketing",
    title: "Marketingové a digitální poradenství",
    description:
      "Praktické poradenství pro online prezentaci, technické SEO základy, strukturu webu a digitální komunikaci.",
    when:
      "Hodí se, když web vypadá hotově, ale není jasné, komu co nabízí, proč má návštěvník napsat a jak měřit výsledek.",
    output:
      "Výstupem může být úprava struktury webu, textů, CTA, SEO základů, měření nebo doporučení další online prezentace.",
    example:
      "Přepracování landing page tak, aby místo obecného popisu služeb vedla návštěvníka ke konkrétní poptávce.",
    icon: LineChart,
  },
  {
    id: "training",
    title: "Školení a technická podpora",
    description:
      "Individuální školení, vysvětlení technických postupů, pomoc s nástroji a podpora při používání digitálních řešení.",
    when:
      "Hodí se, když potřebujete pochopit nové nástroje, převzít hotové řešení nebo získat jistotu při běžné správě webu a systémů.",
    output:
      "Výstupem může být individuální vysvětlení, krátký návod, předávací dokumentace, technická podpora nebo praktická konzultace.",
    example:
      "Předání webu včetně vysvětlení správy obsahu, provozních kontrol, domény, analytiky a dalších návazností.",
    icon: GraduationCap,
  },
]
