import { Mail } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"
import { ButtonLink, ButtonRouterLink } from "@/components/ui/Button"
import { services } from "@/data/services"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {service.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-gradient-soft opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                />
              </article>
            )
          })}
        </div>
      </Section>

      <Section>
        <div className="border-gradient-brand glow-brand mx-auto max-w-3xl rounded-[calc(var(--radius)+6px)] bg-card/60 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Máte konkrétní zadání?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Napište mi rozsah projektu, termín a orientační rozpočet — ozvu se
            s návrhem postupu.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <ButtonLink href={business.emailHref} variant="primary">
              <Mail className="h-4 w-4" aria-hidden />
              Nezávazně napsat e-mail
            </ButtonLink>
            <ButtonRouterLink to="/kontakt" variant="secondary">
              Zobrazit kontakt
            </ButtonRouterLink>
          </div>
        </div>
      </Section>
    </main>
  )
}
