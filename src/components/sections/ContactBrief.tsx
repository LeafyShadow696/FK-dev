import { useState } from "react"
import { Check, Clipboard, Copy, Mail } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"
import { Button, ButtonLink } from "@/components/ui/Button"
import { business } from "@/data/business"

const briefItems = [
  "Co řešíte a proč je to teď důležité",
  "Jaký je současný stav webu, procesu nebo systému",
  "Co má být na konci hotové nebo výrazně lepší",
  "Jaký termín nebo milník potřebujete stihnout",
  "Jaký je orientační rozpočet nebo rozsah spolupráce",
  "Jaký kontakt a čas komunikace preferujete",
]

const briefTemplate = `Dobrý den,

mám zájem probrat projekt nebo technickou konzultaci.

Co řeším:

Současný stav:

Požadovaný výsledek:

Termín:

Orientační rozpočet / rozsah:

Preferovaný kontakt:

Děkuji.`

async function copyText(text: string) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API is not available")
  }
  await navigator.clipboard.writeText(text)
}

export function ContactBrief() {
  const [copied, setCopied] = useState<"email" | "brief" | null>(null)

  const handleCopy = async (type: "email" | "brief", value: string) => {
    await copyText(value)
    setCopied(type)
    window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <Section id="prvni-zprava">
      <SectionHeader
        eyebrow="První zpráva"
        title={
          <>
            Co poslat pro rychlejší{" "}
            <span className="text-gradient-brand">návrh postupu</span>
          </>
        }
        description="Nemusíte připravovat dlouhé zadání. Stačí několik praktických bodů, podle kterých se dá odhadnout rozsah, rizika a nejbližší další krok."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr,0.9fr]">
        <div className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6 sm:p-8">
          <h3 className="font-display text-2xl font-semibold text-foreground">
            Stručný brief
          </h3>
          <ul className="mt-5 grid gap-3">
            {briefItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 h-5 w-5 flex-none text-foreground/90"
                  aria-hidden
                />
                <span className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6 sm:p-8">
          <h3 className="font-display text-2xl font-semibold text-foreground">
            Rychlé akce
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Pokud mailto odkaz neotevře správného klienta, zkopírujte si e-mail
            nebo šablonu zadání ručně.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href={business.emailHref} variant="primary">
              <Mail className="h-4 w-4" aria-hidden />
              Napsat e-mail
            </ButtonLink>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleCopy("email", business.email)}
            >
              <Copy className="h-4 w-4" aria-hidden />
              {copied === "email" ? "E-mail zkopírován" : "Zkopírovat e-mail"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleCopy("brief", briefTemplate)}
            >
              <Clipboard className="h-4 w-4" aria-hidden />
              {copied === "brief" ? "Šablona zkopírována" : "Zkopírovat šablonu"}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
