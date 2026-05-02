import { CheckCircle2 } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"

const points = [
  "Praktický přístup od nápadu po funkční řešení",
  "Důraz na bezpečnost, přehlednost a udržitelnost",
  "Moderní technologie bez zbytečné složitosti",
  "Řešení připravená pro další rozvoj",
  "Férová komunikace a jasný postup",
]

export function WhyMe() {
  return (
    <Section id="proc-ja">
      <SectionHeader
        eyebrow="Proč spolupracovat"
        title={
          <>
            Spolehlivá technická{" "}
            <span className="text-gradient-brand">spolupráce</span>
          </>
        }
        description="Stavím na praktickém přístupu, jasné komunikaci a dlouhodobě udržitelných řešeních. Cílem je systém, který skutečně funguje v každodenním používání."
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-3 rounded-[var(--radius)] border border-border/70 bg-card/40 p-5"
          >
            <CheckCircle2
              className="mt-0.5 h-5 w-5 flex-none text-brand-teal"
              aria-hidden
            />
            <span className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
