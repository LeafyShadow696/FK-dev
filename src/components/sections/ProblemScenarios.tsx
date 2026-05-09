import {
  ClipboardList,
  DatabaseZap,
  GitBranch,
  Globe2,
  ServerCog,
  Wrench,
} from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"

const scenarios = [
  {
    title: "Ruční práce bere čas",
    description:
      "Data se přepisují mezi tabulkami, e-maily a systémy. Cílem je z toho udělat opakovatelný postup, skript nebo jednoduchý interní nástroj.",
    icon: ClipboardList,
  },
  {
    title: "Web nepřináší poptávky",
    description:
      "Prezentace existuje, ale návštěvník rychle nepochopí nabídku, důvod ke kontaktu ani další krok.",
    icon: Globe2,
  },
  {
    title: "Systémy spolu nemluví",
    description:
      "Objednávky, formuláře, exporty nebo služby zůstávají oddělené. Pomůže API integrace, webhook nebo synchronizace dat.",
    icon: GitBranch,
  },
  {
    title: "Chybí interní nástroj",
    description:
      "Proces je moc specifický pro hotový software, ale příliš častý na ruční řešení. Tady dává smysl malá webová aplikace nebo PWA.",
    icon: DatabaseZap,
  },
  {
    title: "Provoz je nepřehledný",
    description:
      "Doména, DNS, hosting, měření, e-mail a nasazení nejsou jasně zdokumentované nebo stabilní.",
    icon: ServerCog,
  },
  {
    title: "Potřebujete technické rozhodnutí",
    description:
      "Než investujete do vývoje nebo nástroje, dává smysl ověřit možnosti, rizika, rozsah a nejmenší funkční řešení.",
    icon: Wrench,
  },
]

export function ProblemScenarios() {
  return (
    <Section id="problemy">
      <SectionHeader
        eyebrow="Typické situace"
        title={
          <>
            Kdy dává smysl ozvat se{" "}
            <span className="text-gradient-brand">s projektem</span>
          </>
        }
        description="Nemusíte mít hotové zadání. Stačí problém, opakovaná ruční práce nebo nápad, který potřebuje technicky uchopit."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.title}
              className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-card/60">
                <Icon className="h-5 w-5 text-brand-teal" aria-hidden />
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
