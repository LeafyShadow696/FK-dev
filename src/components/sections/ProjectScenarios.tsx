import { ArrowRight, Gauge, Link2, PanelsTopLeft } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"

const cases = [
  {
    title: "Automatizace opakované agendy",
    context:
      "Klient má pravidelný export nebo tabulku, kterou ručně upravuje a posílá dál.",
    outcome:
      "Výstupem je skript nebo malý nástroj, který data zkontroluje, upraví a připraví pro další krok.",
    icon: Gauge,
  },
  {
    title: "Poptávkový web pro službu",
    context:
      "Služba je kvalitní, ale web neříká dost jasně, pro koho je, co řeší a proč má návštěvník napsat.",
    outcome:
      "Výstupem je struktura stránky, texty, CTA, SEO základ, měření a rychlé produkční nasazení.",
    icon: PanelsTopLeft,
  },
  {
    title: "Propojení nástrojů přes API",
    context:
      "Informace vznikají v jednom systému, ale pro práci jsou potřeba v jiném formátu nebo jiné službě.",
    outcome:
      "Výstupem je integrace, webhook nebo synchronizace, která odstraní ruční mezikroky.",
    icon: Link2,
  },
]

export function ProjectScenarios() {
  return (
    <Section id="scenare">
      <SectionHeader
        eyebrow="Příklady"
        title={
          <>
            Jak může vypadat{" "}
            <span className="text-gradient-brand">konkrétní výsledek</span>
          </>
        }
        description="Ukázkové scénáře jsou anonymizované, ale odpovídají typům zadání, která dávají pro tento web největší smysl."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {cases.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.title}
              className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-card/60">
                <Icon className="h-5 w-5 text-foreground/90" aria-hidden />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.context}
              </p>
              <div className="mt-5 flex gap-3 rounded-lg border border-border/60 bg-background/30 p-4">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 flex-none text-foreground/90"
                  aria-hidden
                />
                <p className="text-sm leading-relaxed text-foreground/90">
                  {item.outcome}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
