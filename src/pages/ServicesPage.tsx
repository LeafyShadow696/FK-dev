import { ArrowRight, Mail } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"
import { ButtonLink, ButtonRouterLink } from "@/components/ui/Button"
import { services } from "@/data/services"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

const pillars = [
  {
    title: "Weby a PWA",
    description:
      "Prezentační weby, landing page, klientská rozhraní a PWA aplikace, které mají jasný účel a dobře se provozují.",
  },
  {
    title: "Automatizace a interní nástroje",
    description:
      "Skripty, menší aplikace, datové workflow a API propojení pro opakované procesy, které nemají zůstávat ruční.",
  },
  {
    title: "Technické konzultace a provoz",
    description:
      "Rozhodnutí před vývojem, audit stávajícího řešení, hosting, DNS, měření, předání a dlouhodobější technická podpora.",
  },
]

export default function ServicesPage() {
  useSeo({
    title: `Služby | ${business.fullName}`,
    description:
      "Webové aplikace, PWA, Python automatizace, API integrace, cloud a self-hosted řešení, IT konzultace, hosting, marketing a školení.",
    path: "/sluzby",
  })

  return (
    <main className="pt-32">
      <Section className="!py-12 sm:!py-16">
        <SectionHeader
          as="h1"
          eyebrow="Služby"
          title={
            <>
              Digitální řešení a{" "}
              <span className="text-gradient-brand">automatizace</span>
            </>
          }
          description="Digitální řešení, automatizace a webové aplikace pro podnikatele a firmy."
        />
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6"
            >
              <h2 className="font-display text-xl font-semibold text-foreground">
                {pillar.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-5 lg:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article
                key={service.id}
                className="group relative overflow-hidden rounded-[var(--radius)] border border-border/70 bg-card/40 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-violet/50 hover:bg-card/70"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-card/60">
                  <Icon className="h-5 w-5 text-foreground" aria-hidden />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <div className="mt-5 grid gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Kdy se hodí
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {service.when}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Výstup
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {service.output}
                    </p>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-border/60 bg-background/30 p-4">
                    <ArrowRight
                      className="mt-0.5 h-4 w-4 flex-none text-brand-teal"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {service.example}
                    </p>
                  </div>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-gradient-soft opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                />
              </article>
            )
          })}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-6 sm:p-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Oprávnění
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Služby navazují na živnostenské oprávnění
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Činnost je vedena pod IČO {business.ico}. Předmětem podnikání je{" "}
              {business.tradeName.toLowerCase()}, mimo jiné poskytování
              software, IT poradenství, zpracování dat, hostingové činnosti,
              webové portály, konzultace, marketing a školení.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="border-gradient-brand glow-brand mx-auto max-w-3xl rounded-[calc(var(--radius)+6px)] bg-card/60 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Máte konkrétní zadání?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Napište mi, co řešíte, jaký je současný stav a co má být na konci
            lepší. Pokud rozsah ještě neznáte, začneme konzultací.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <ButtonLink href={business.emailHref} variant="primary">
              <Mail className="h-4 w-4" aria-hidden />
              Poslat zadání
            </ButtonLink>
            <ButtonRouterLink to="/kontakt" variant="secondary">
              Zobrazit kontakt
            </ButtonRouterLink>
            <ButtonRouterLink to="/spoluprace" variant="ghost">
              Jak probíhá spolupráce
            </ButtonRouterLink>
            <ButtonRouterLink to="/priklady" variant="ghost">
              Příklady řešení
            </ButtonRouterLink>
          </div>
        </div>
      </Section>
    </main>
  )
}
