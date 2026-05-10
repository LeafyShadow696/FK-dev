import { ExternalLink, MapPin } from "lucide-react"
import { AddressLink } from "@/components/ui/AddressLink"
import { business } from "@/data/business"

export function FooterMap() {
  return (
    <section
      aria-labelledby="footer-map-title"
      className="mt-12 overflow-hidden rounded-[var(--radius)] border border-border/70 bg-card/40"
    >
      <div className="grid gap-0 lg:grid-cols-[0.85fr,1.15fr]">
        <div className="p-6 sm:p-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-card/60">
            <MapPin className="h-5 w-5 text-brand-teal" aria-hidden />
          </div>
          <h2
            id="footer-map-title"
            className="mt-5 font-display text-2xl font-semibold text-foreground"
          >
            Kontaktní adresa
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Kliknutím na adresu otevřete mapu v novém okně.
          </p>
          <AddressLink
            href={business.address.mapsHref}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            {business.address.full}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </AddressLink>
        </div>
        <div className="min-h-64 border-t border-border/70 lg:border-l lg:border-t-0">
          <iframe
            title={`Mapa: ${business.address.full}`}
            src={business.address.mapEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full grayscale-[20%] invert-0 dark:grayscale dark:invert"
          />
        </div>
      </div>
    </section>
  )
}
