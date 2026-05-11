import { CheckCircle2 } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"

const caseStudies = [
  {
    title: "Automatizace tabulkového procesu",
    problem:
      "Opakovaný export se ručně čistil, kontroloval a upravoval před dalším použitím.",
    solution:
      "Navržený skript sjednotí formát, ověří povinná pole a připraví výstup pro navazující nástroj.",
    outcome:
      "Méně ručních kroků, nižší riziko překlepu a jasný postup, který lze opakovat bez zbytečného vysvětlování.",
    tags: ["Python", "data", "automatizace"],
  },
  {
    title: "Poptávkový web pro službu",
    problem:
      "Návštěvník nerozuměl dost rychle nabídce, cílové skupině ani dalšímu kroku ke kontaktu.",
    solution:
      "Struktura webu se rozdělí podle rozhodování klienta: problém, služba, spolupráce, příklady a kontakt.",
    outcome:
      "Web se snadněji čte, má jasnější CTA a každá podstránka odpovídá konkrétní otázce návštěvníka.",
    tags: ["landing page", "SEO", "CTA"],
  },
  {
    title: "API propojení nástrojů",
    problem:
      "Data vznikala v jedné službě, ale tým je potřeboval používat jinde a v jiném formátu.",
    solution:
      "Jednoduchá integrační vrstva převezme data, upraví je a předá do cílového systému nebo exportu.",
    outcome:
      "Méně přepisování, rychlejší předání informací a přehlednější technický základ pro další rozvoj.",
    tags: ["API", "integrace", "workflow"],
  },
]

export function CaseStudies() {
  return (
    <Section id="modelove-ukazky">
      <SectionHeader
        eyebrow="Modelové ukázky"
        title={
          <>
            Detailnější příklady{" "}
            <span className="text-gradient-brand">možných výstupů</span>
          </>
        }
        description="Nejde o veřejné klientské reference. Jsou to praktické modelové situace, které ukazují, jak se dá problém převést na použitelný výstup."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {caseStudies.map((item) => (
          <article
            key={item.title}
            className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6"
          >
            <h3 className="font-display text-xl font-semibold text-foreground">
              {item.title}
            </h3>
            <div className="mt-5 grid gap-4">
              <CaseRow label="Problém" text={item.problem} />
              <CaseRow label="Řešení" text={item.solution} />
              <CaseRow label="Přínos" text={item.outcome} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/70 bg-background/30 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

function CaseRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2
        className="mt-0.5 h-4 w-4 flex-none text-foreground/90"
        aria-hidden
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{label}:</span> {text}
      </p>
    </div>
  )
}
