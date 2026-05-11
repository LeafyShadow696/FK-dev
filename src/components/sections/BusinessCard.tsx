import { Globe, Mail, MapPin, Phone } from "lucide-react"
import { motion } from "framer-motion"
import { Section, SectionHeader } from "@/components/ui/Section"
import { FKMonogram } from "@/components/brand/FKMonogram"
import { AddressLink } from "@/components/ui/AddressLink"
import { AddContactButton } from "@/components/contact/AddContactButton"
import { business } from "@/data/business"

export function BusinessCard() {
  return (
    <Section id="vizitka">
      <SectionHeader
        eyebrow="Kontakt"
        title={
          <>
            Pojďme to <span className="text-gradient-brand">probrat</span>
          </>
        }
        description="Premium business card — všechny kontaktní údaje na jednom místě. Stačí kliknout na e-mail nebo telefon."
        align="center"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto mt-14 max-w-3xl"
      >
        <div className="border-gradient-brand glow-brand relative overflow-hidden rounded-[calc(var(--radius)+6px)] bg-card/60 p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-gradient-soft blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-gradient-soft blur-3xl"
          />

          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex flex-none items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-border/70 bg-card/80 sm:h-32 sm:w-32">
                <FKMonogram className="h-20 w-20 sm:h-24 sm:w-24" title="FK" />
              </div>
            </div>

            <div className="flex flex-col gap-4 text-center sm:text-left">
              <div>
                <div className="brand-script text-5xl text-gradient-brand sm:text-6xl">
                  {business.legalName}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {business.brandName}
                </div>
              </div>
              <p className="text-base italic text-muted-foreground sm:text-lg">
                &ldquo;{business.motto}&rdquo;
              </p>

              <div className="hairline mt-1" />

              <ul className="flex flex-col gap-3 text-sm sm:text-base">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <Phone className="h-4 w-4 text-brand-pink" aria-hidden />
                  </span>
                  <a
                    href={business.phoneHref}
                    className="font-medium text-foreground hover:text-foreground/80"
                  >
                    {business.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <Mail className="h-4 w-4 text-brand-violet" aria-hidden />
                  </span>
                  <a
                    href={business.emailHref}
                    className="font-medium text-foreground hover:text-foreground/80 break-all"
                  >
                    {business.email}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <MapPin className="h-4 w-4 text-brand-teal" aria-hidden />
                  </span>
                  <AddressLink
                    href={business.address.mapsHref}
                    className="text-foreground/90"
                  >
                    {business.address.full}
                  </AddressLink>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border/70 bg-card/60">
                    <Globe className="h-4 w-4 text-brand-indigo" aria-hidden />
                  </span>
                  <a
                    href={business.url}
                    className="font-medium text-foreground hover:text-foreground/80"
                  >
                    {business.domain}
                  </a>
                </li>
              </ul>
              <AddContactButton className="mt-2 flex flex-col items-stretch sm:items-start" />
            </div>
          </div>
        </div>
      </motion.div>
    </Section>
  )
}
