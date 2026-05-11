import { Code2, FileCheck2, Rocket, ShieldCheck } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"

const outcomes = [
  {
    title: "Použitelný produkt",
    description:
      "Web, aplikace nebo interní nástroj připravený pro reálné používání, ne jen vizuální návrh bez provozního kontextu.",
    icon: Rocket,
  },
  {
    title: "Technický základ",
    description:
      "Čitelný kód, jasná struktura projektu, rozumné dependency a nastavení pro další rozvoj nebo předání.",
    icon: Code2,
  },
  {
    title: "Nasazení a provoz",
    description:
      "Pomoc s hostingem, doménou, DNS, analytikou, e-mailem a základní kontrolou produkčního prostředí.",
    icon: ShieldCheck,
  },
  {
    title: "Srozumitelné předání",
    description:
      "Shrnutí postupu, doporučení další údržby a praktické vysvětlení toho, jak s řešením pracovat.",
    icon: FileCheck2,
  },
]

export function ProjectOutcomes() {
  return (
    <Section id="vystupy">
      <SectionHeader
        eyebrow="Výstupy"
        title={
          <>
            Co má být na konci{" "}
            <span className="text-gradient-brand">hotové</span>
          </>
        }
        description="Cílem spolupráce je funkční řešení s jasným provozním kontextem, ne pouze sada obrazovek nebo technických slibů."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {outcomes.map((item) => {
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
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
