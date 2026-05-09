import { Mail } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"
import { ButtonLink } from "@/components/ui/Button"
import { business } from "@/data/business"

const models = [
  {
    title: "Konzultace nebo audit",
    description:
      "Rychlé zorientování ve stávajícím řešení, návrh dalšího postupu, technické doporučení nebo kontrola před investicí.",
    bestFor: "Když ještě nevíte, co přesně zadat.",
  },
  {
    title: "Malá úprava nebo automatizace",
    description:
      "Jednorázové zlepšení webu, skript, API napojení, oprava, provozní nastavení nebo technická podpora.",
    bestFor: "Když je problém jasný a potřebuje rychlé řešení.",
  },
  {
    title: "Web, PWA nebo interní nástroj",
    description:
      "Návrh, realizace, nasazení a předání digitálního řešení s jasným rozsahem a použitelným výsledkem.",
    bestFor: "Když potřebujete vytvořit nový funkční výstup.",
  },
]

export function CollaborationModels() {
  return (
    <Section id="modely-spoluprace">
      <div className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr] lg:items-start">
        <SectionHeader
          eyebrow="Modely spolupráce"
          title={
            <>
              Nemusíte hned poptávat{" "}
              <span className="text-gradient-brand">velký projekt</span>
            </>
          }
          description="Spolupráce může začít krátkou konzultací, menší opravou nebo konkrétním výstupem. Důležité je nejdřív pojmenovat problém a zvolit přiměřený rozsah."
        />

        <div className="grid gap-4">
          {models.map((model) => (
            <article
              key={model.title}
              className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6"
            >
              <h3 className="font-display text-xl font-semibold text-foreground">
                {model.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {model.description}
              </p>
              <p className="mt-4 text-sm font-medium text-foreground/90">
                {model.bestFor}
              </p>
            </article>
          ))}
          <div className="pt-2">
            <ButtonLink href={business.emailHref} variant="primary">
              <Mail className="h-4 w-4" aria-hidden />
              Chci probrat zadání
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  )
}
