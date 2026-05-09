import { MessageSquare, PenTool, Rocket, Wrench } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"

const steps = [
  {
    title: "Konzultace",
    description:
      "Nejdřív si ujasníme cíl, rozsah, termín, rozpočet a co má řešení opravdu zlepšit.",
    icon: MessageSquare,
  },
  {
    title: "Návrh postupu",
    description:
      "Dostanete doporučený rozsah prací, priority, technický směr a realistický plán realizace.",
    icon: PenTool,
  },
  {
    title: "Realizace",
    description:
      "Postupná tvorba, průběžné kontroly, jasná komunikace a rozhodování nad konkrétními výstupy.",
    icon: Wrench,
  },
  {
    title: "Nasazení a podpora",
    description:
      "Produkční nasazení, základní ověření, předání a dohoda na další údržbě nebo rozvoji.",
    icon: Rocket,
  },
]

export function CollaborationProcess() {
  return (
    <Section id="postup">
      <SectionHeader
        eyebrow="Postup"
        title={
          <>
            Spolupráce od prvního zadání po{" "}
            <span className="text-gradient-brand">nasazení</span>
          </>
        }
        description="Každý projekt držím v praktických krocích, aby bylo jasné, co se řeší teď, co následuje a podle čeho poznáme hotový výsledek."
      />

      <ol className="mt-12 grid gap-5 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <li
              key={step.title}
              className="relative rounded-[var(--radius)] border border-border/70 bg-card/40 p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card/60">
                  <Icon className="h-5 w-5 text-brand-violet" aria-hidden />
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
