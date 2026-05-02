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
  icon: LucideIcon
}

export const services: Service[] = [
  {
    id: "web-pwa",
    title: "Webové aplikace & PWA",
    description:
      "Návrh a vývoj moderních webových aplikací, responzivních rozhraní a PWA řešení připravených pro praktické používání.",
    icon: Code2,
  },
  {
    id: "automation",
    title: "Python automatizace",
    description:
      "Automatizace opakovaných procesů, práce s daty, skripty, interní nástroje a optimalizace workflow.",
    icon: Workflow,
  },
  {
    id: "api",
    title: "API integrace",
    description:
      "Propojování systémů, externích služeb, webových aplikací a podnikových nástrojů přes API.",
    icon: Layers,
  },
  {
    id: "cloud",
    title: "Cloud & self-hosted řešení",
    description:
      "Návrh, nasazení a údržba cloudových nebo self-hosted řešení s důrazem na kontrolu, bezpečnost a dlouhodobou udržitelnost.",
    icon: Cloud,
  },
  {
    id: "consulting",
    title: "IT konzultace",
    description:
      "Konzultace technického řešení, výběr vhodných nástrojů, návrh architektury a praktická podpora při digitalizaci.",
    icon: Settings2,
  },
  {
    id: "hosting",
    title: "Hosting, data & webové portály",
    description:
      "Technická příprava webových projektů, práce s daty, hostingové workflow a provoz webových portálů.",
    icon: Server,
  },
  {
    id: "marketing",
    title: "Marketingové a digitální poradenství",
    description:
      "Praktické poradenství pro online prezentaci, technické SEO základy, strukturu webu a digitální komunikaci.",
    icon: LineChart,
  },
  {
    id: "training",
    title: "Školení a technická podpora",
    description:
      "Individuální školení, vysvětlení technických postupů, pomoc s nástroji a podpora při používání digitálních řešení.",
    icon: GraduationCap,
  },
]
