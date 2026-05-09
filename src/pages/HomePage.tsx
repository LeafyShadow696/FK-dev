import { Hero } from "@/components/sections/Hero"
import { ProblemScenarios } from "@/components/sections/ProblemScenarios"
import { ServicesOverview } from "@/components/sections/ServicesOverview"
import { BusinessCard } from "@/components/sections/BusinessCard"
import { useSeo } from "@/utils/seo"

export default function HomePage() {
  useSeo({
    title:
      "František Kalášek / TopBot PwnZ™ | Webové aplikace, PWA, automatizace a IT konzultace",
    description:
      "František Kalášek / TopBot PwnZ™ – vývoj webových aplikací, PWA řešení, automatizace, API integrace, cloudová a self-hosted řešení a technologické konzultace.",
    path: "/",
  })

  return (
    <>
      <Hero />
      <ProblemScenarios compact />
      <ServicesOverview />
      <BusinessCard />
    </>
  )
}
