import { ProblemScenarios } from "@/components/sections/ProblemScenarios"
import { ProjectScenarios } from "@/components/sections/ProjectScenarios"
import { CaseStudies } from "@/components/sections/CaseStudies"
import { Section, SectionHeader } from "@/components/ui/Section"
import { ButtonLink, ButtonRouterLink } from "@/components/ui/Button"
import { Mail } from "lucide-react"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function ExamplesPage() {
  useSeo({
    title: `Příklady řešení | ${business.fullName}`,
    description:
      "Typické situace a anonymizované příklady projektů: automatizace agendy, poptávkový web, API propojení, interní nástroje a provozní zázemí.",
    path: "/priklady",
  })

  return (
    <main className="pt-32">
      <Section className="!py-12 sm:!py-16">
        <SectionHeader
          as="h1"
          eyebrow="Příklady"
          title={
            <>
              Problémy a scénáře, které mají{" "}
              <span className="text-gradient-brand">praktické řešení</span>
            </>
          }
          description="Nemusíte přijít s přesnou specifikací. Často stačí popsat současný stav, opakovanou ruční práci nebo výsledek, ke kterému se chcete dostat."
        />
      </Section>

      <ProblemScenarios />
      <ProjectScenarios />
      <CaseStudies />

      <Section>
        <div className="border-gradient-brand glow-brand mx-auto max-w-3xl rounded-[calc(var(--radius)+6px)] bg-card/60 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Poznáváte podobný problém?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Pošlete stručný popis současného stavu a cíle. Navrhnu, jestli dává
            smysl konzultace, menší automatizace nebo samostatný projekt.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <ButtonLink href={business.emailHref} variant="primary">
              <Mail className="h-4 w-4" aria-hidden />
              Popsat problém
            </ButtonLink>
            <ButtonRouterLink to="/spoluprace" variant="secondary">
              Jak probíhá spolupráce
            </ButtonRouterLink>
          </div>
        </div>
      </Section>
    </main>
  )
}
