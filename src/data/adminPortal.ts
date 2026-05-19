import {
  Activity,
  Bot,
  Cloud,
  Database,
  GitBranch,
  HardDrive,
  LockKeyhole,
  MailCheck,
  Server,
  Shield,
} from "lucide-react"

export const portalIntegrations = [
  {
    id: "vercel",
    label: "Vercel",
    icon: Cloud,
    purpose: "Produkční deploye, domény, build logy a stav webu.",
  },
  {
    id: "github",
    label: "GitHub",
    icon: GitBranch,
    purpose: "Repozitář, historie změn, issues a budoucí workflow.",
  },
  {
    id: "render",
    label: "Render",
    icon: Server,
    purpose: "Možný Python backend, workery nebo dlouho běžící služby.",
  },
  {
    id: "railway",
    label: "Railway",
    icon: Activity,
    purpose: "Alternativní runtime pro backend a provozní služby.",
  },
  {
    id: "database",
    label: "Databáze",
    icon: Database,
    purpose: "Nastavení portálu, audit log a budoucí interní data.",
  },
  {
    id: "storage",
    label: "Google Drive",
    icon: HardDrive,
    purpose: "Soukromé exporty, úřední podklady a pracovní dokumenty.",
  },
  {
    id: "ai",
    label: "AI providers",
    icon: Bot,
    purpose: "OpenAI, Gemini a budoucí agentní funkce portálu.",
  },
  {
    id: "tailscale",
    label: "Tailscale",
    icon: Shield,
    purpose: "Privátní síťový přístup pro backend a interní služby.",
  },
  {
    id: "isds",
    label: "Datová schránka",
    icon: MailCheck,
    purpose: "Koncepty podání, ruční autorizace bankovní identitou a audit stopa.",
  },
] as const

export const backendRecommendation = {
  runtime: "Python / FastAPI",
  hosting: "Render Web Service",
  database: "PostgreSQL",
  storage:
    "Google Drive pro soukromé exporty a úřední podklady; Vercel Blob pouze pro veřejné assety",
  reason:
    "FastAPI je vhodné pro čitelné typed API, integrace s externími providery, audit logy a delší backend procesy mimo statický frontend.",
} as const

export const portalPrinciples = [
  {
    title: "Soukromý vstup",
    text: "Veřejný web zůstává oddělený od administrace. Přístup se ověřuje na serveru.",
    icon: LockKeyhole,
  },
  {
    title: "Žádné tokeny ve frontendu",
    text: "API klíče patří pouze do env proměnných produkčního prostředí.",
    icon: Server,
  },
  {
    title: "Postupné napojování",
    text: "Nejprve bezpečný základ, potom databáze, audit log a reálné provider API.",
    icon: GitBranch,
  },
] as const
