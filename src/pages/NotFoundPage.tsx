import { Link } from "wouter"
import { Section } from "@/components/ui/Section"
import { ButtonRouterLink } from "@/components/ui/Button"
import { FKMonogram } from "@/components/brand/FKMonogram"
import { useSeo } from "@/utils/seo"
import { business } from "@/data/business"

export default function NotFoundPage() {
  useSeo({
    title: `404 — stránka nenalezena | ${business.fullName}`,
    description: "Požadovaná stránka neexistuje nebo byla přesunuta.",
    path: "/404",
  })

  return (
    <main className="pt-32">
      <Section className="!py-24">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-border/70 bg-card/60">
            <FKMonogram className="h-16 w-16" title="FK" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Chyba 404
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient-brand">Stránka nenalezena</span>
          </h1>
          <p className="mt-4 text-pretty text-muted-foreground">
            Zdá se, že požadovaná stránka neexistuje nebo byla přesunuta.
            Můžete pokračovat na úvod nebo si prohlédnout nabízené služby.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row">
            <ButtonRouterLink to="/" variant="primary">
              Zpět na úvod
            </ButtonRouterLink>
            <Link
              href="/sluzby"
              className="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/40 px-5 py-3 text-sm font-medium hover:bg-card/70"
            >
              Zobrazit služby
            </Link>
          </div>
        </div>
      </Section>
    </main>
  )
}
