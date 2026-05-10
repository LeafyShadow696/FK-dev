import { Link } from "wouter"
import { Mail, MapPin, Phone, Globe } from "lucide-react"
import { FKMonogram } from "@/components/brand/FKMonogram"
import { FooterMap } from "@/components/layout/FooterMap"
import { AddressLink } from "@/components/ui/AddressLink"
import { useConsent } from "@/components/privacy/ConsentProvider"
import { business } from "@/data/business"

const mainLinks = [
  { href: "/", label: "Úvod" },
  { href: "/sluzby", label: "Služby" },
  { href: "/spoluprace", label: "Spolupráce" },
  { href: "/priklady", label: "Příklady" },
  { href: "/kontakt", label: "Kontakt" },
]

const legalLinks = [
  { href: "/pravni-udaje", label: "Právní údaje" },
  { href: "/ochrana-osobnich-udaju", label: "Ochrana osobních údajů" },
  { href: "/cookies", label: "Cookies" },
  { href: "/podminky-pouziti", label: "Podmínky použití" },
]

export function Footer() {
  const year = new Date().getFullYear()
  const { openPreferences } = useConsent()

  return (
    <footer className="relative mt-32 border-t border-border/60 bg-background/60">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-card/60">
                <FKMonogram className="h-7 w-7" title="FK" />
              </span>
              <div className="leading-tight">
                <div className="font-display text-lg font-semibold tracking-tight text-gradient-brand">
                  {business.legalName}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {business.brandName}
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-md font-serif text-base italic leading-relaxed text-muted-foreground">
              &ldquo;{business.motto}&rdquo;
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-teal" aria-hidden />
                <AddressLink href={business.address.mapsHref}>
                  {business.address.full}
                </AddressLink>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-brand-pink" aria-hidden />
                <a href={business.phoneHref} className="hover:text-foreground">
                  {business.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-brand-violet" aria-hidden />
                <a href={business.emailHref} className="hover:text-foreground">
                  {business.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 text-brand-indigo" aria-hidden />
                <a
                  href={business.url}
                  className="hover:text-foreground"
                  rel="noopener"
                >
                  {business.domain}
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
              Navigace
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {mainLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
              Právní informace
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <FooterMap />

        <div className="mt-12 hairline" />

        <div className="mt-8 flex flex-col items-start justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {business.fullName}. Všechna práva vyhrazena.
          </p>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <AddressLink
              href={business.address.mapsHref}
              className="font-medium"
            >
              {business.address.full}
            </AddressLink>
            <button
              type="button"
              onClick={openPreferences}
              className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Nastavení cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
