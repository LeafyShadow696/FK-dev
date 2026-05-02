import { ArrowRight } from "lucide-react"
import { Link } from "wouter"
import { Section, SectionHeader } from "@/components/ui/Section"
import { services } from "@/data/services"

export function ServicesOverview() {
  return (
    <Section id="sluzby-overview">
      <SectionHeader
        eyebrow="Služby"
        title={
          <>
            Co pro vás dokážu <span className="text-gradient-brand">vytvořit</span>
          </>
        }
        description="Kompletní spektrum technických služeb pro firmy i jednotlivce — od webových aplikací přes automatizaci až po cloudové systémy."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 6).map((service) => {
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
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-gradient-soft opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              />
            </article>
          )
        })}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/sluzby"
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground"
        >
          Všechny služby
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </Section>
  )
}
