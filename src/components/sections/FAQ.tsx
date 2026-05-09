import { Section, SectionHeader } from "@/components/ui/Section"
import { business } from "@/data/business"

const questions = [
  {
    question: "Pro koho je spolupráce vhodná?",
    answer:
      "Pro jednotlivce, podnikatele a menší firmy, které potřebují webovou aplikaci, automatizaci, API integraci, technické poradenství nebo pomoc s provozem digitálního řešení.",
  },
  {
    question: "Jak probíhá nacenění?",
    answer:
      "Nejdřív je potřeba znát cíl, rozsah, termín a očekávaný výstup. Poté dává smysl navrhnout realistický postup, orientační cenu a případné fáze projektu.",
  },
  {
    question: "Je možné řešit i menší úpravy nebo konzultace?",
    answer:
      "Ano. Vedle větších projektů dávají smysl i jednorázové konzultace, audit stávajícího řešení, opravy, automatizace nebo technická podpora.",
  },
  {
    question: "Co je dobré poslat v první zprávě?",
    answer:
      "Stručně popište typ projektu, současný stav, požadovaný výsledek, termín, rozpočet a kontakt. Čím konkrétnější zadání, tím rychleji lze navrhnout další krok.",
  },
  {
    question: "Ukládá web zprávy z kontaktu?",
    answer:
      "Ne. Kontakt probíhá přes e-mailového klienta nebo telefon. Web nemá vlastní kontaktní formulář ani databázi zpráv.",
  },
]

export function FAQ() {
  return (
    <Section id="faq">
      <SectionHeader
        eyebrow="FAQ"
        title={
          <>
            Časté otázky před{" "}
            <span className="text-gradient-brand">spoluprací</span>
          </>
        }
        description="Základní odpovědi k poptávce, rozsahu služeb a prvnímu kontaktu."
      />

      <div className="mt-12 divide-y divide-border/70 rounded-[var(--radius)] border border-border/70 bg-card/40">
        {questions.map((item) => (
          <details key={item.question} className="group p-5 sm:p-6">
            <summary className="cursor-pointer list-none font-display text-lg font-semibold text-foreground marker:hidden">
              <span className="inline-flex w-full items-center justify-between gap-4">
                {item.question}
                <span className="text-sm text-brand-teal transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {item.answer}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Pro konkrétní zadání napište na{" "}
        <a className="font-medium text-foreground hover:underline" href={business.emailHref}>
          {business.email}
        </a>
        .
      </p>
    </Section>
  )
}
