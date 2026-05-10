import { Globe, Mail, MapPin, Phone } from "lucide-react"
import { Section, SectionHeader } from "@/components/ui/Section"
import { ButtonLink, ButtonRouterLink } from "@/components/ui/Button"
import { FKMonogram } from "@/components/brand/FKMonogram"
import { ContactBrief } from "@/components/sections/ContactBrief"
import { AddressLink } from "@/components/ui/AddressLink"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function ContactPage() {
  useSeo({
    title: `Kontakt | ${business.fullName}`,
    description:
      "Kontaktujte Františka Kaláška / TopBot PwnZ™ přímo e-mailem nebo telefonicky pro konzultaci nebo realizaci digitálního projektu.",
    path: "/kontakt",
  })

  return (
    <main className="pt-32">
      <Section className="!py-12 sm:!py-16">
        <SectionHeader
          as="h1"
          eyebrow="Kontakt"
          title={
            <>
              Spojme se a něco{" "}
              <span className="text-gradient-brand">postavme</span>
            </>
          }
          description="Máte nápad, projekt nebo potřebujete technickou konzultaci? Ozvěte se přímo e-mailem nebo telefonicky."
        />
      </Section>

      <Section className="!pt-0">
        <div className="border-gradient-brand glow-brand relative mx-auto max-w-4xl overflow-hidden rounded-[calc(var(--radius)+6px)] bg-card/60 p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-gradient-soft blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-brand-gradient-soft blur-3xl"
          />

          <div className="relative grid gap-10 md:grid-cols-[auto,1fr] md:items-start">
            <div className="flex justify-center md:justify-start">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-border/70 bg-card/80 sm:h-40 sm:w-40">
                <FKMonogram className="h-24 w-24 sm:h-28 sm:w-28" title="FK" />
              </div>
            </div>

            <div>
              <div className="text-center md:text-left">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-gradient-brand sm:text-4xl">
                  {business.legalName}
                </h2>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {business.brandName}
                </div>
                <p className="mt-4 font-serif text-base italic text-muted-foreground sm:text-lg">
                  &ldquo;{business.motto}&rdquo;
                </p>
              </div>

              <div className="hairline mt-6" />

              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <Phone className="h-4 w-4 text-brand-pink" aria-hidden />
                  </span>
                  <a
                    href={business.phoneHref}
                    className="text-sm font-medium hover:text-foreground sm:text-base"
                  >
                    {business.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <Mail className="h-4 w-4 text-brand-violet" aria-hidden />
                  </span>
                  <a
                    href={business.emailHref}
                    className="text-sm font-medium hover:text-foreground sm:text-base break-all"
                  >
                    {business.email}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <MapPin className="h-4 w-4 text-brand-teal" aria-hidden />
                  </span>
                  <AddressLink
                    href={business.address.mapsHref}
                    className="text-sm text-foreground/90 sm:text-base"
                  >
                    {business.address.full}
                  </AddressLink>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <Globe className="h-4 w-4 text-brand-indigo" aria-hidden />
                  </span>
                  <a
                    href={business.url}
                    className="text-sm font-medium hover:text-foreground sm:text-base"
                  >
                    {business.domain}
                  </a>
                </li>
              </ul>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row">
                <ButtonLink href={business.emailHref} variant="primary">
                  <Mail className="h-4 w-4" aria-hidden />
                  Napsat e-mail
                </ButtonLink>
                <ButtonLink href={business.phoneHref} variant="secondary">
                  <Phone className="h-4 w-4" aria-hidden />
                  Zavolat
                </ButtonLink>
                <ButtonRouterLink to="/sluzby" variant="ghost">
                  Zobrazit služby
                </ButtonRouterLink>
              </div>

              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                E-mailová komunikace probíhá přímo přes váš e-mailový klient.
                Web neukládá zprávy do vlastní databáze.
              </p>
            </div>
          </div>
        </div>
      </Section>
      <ContactBrief />
    </main>
  )
}
