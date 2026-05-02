import { useEffect, useState } from "react"
import { Link, useLocation } from "wouter"
import { Menu, X } from "lucide-react"
import { cn } from "@/utils/cn"
import { FKMonogram } from "@/components/brand/FKMonogram"
import { business } from "@/data/business"

const nav = [
  { href: "/", label: "Úvod" },
  { href: "/sluzby", label: "Služby" },
  { href: "/kontakt", label: "Kontakt" },
]

export function Header() {
  const [location] = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label={`${business.legalName} — domů`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-card/60">
            <FKMonogram className="h-6 w-6" title="FK" />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-base font-semibold tracking-tight text-gradient-brand">
              {business.legalName}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {business.brandName}
            </span>
          </span>
        </Link>

        <nav aria-label="Hlavní" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = location === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-0.5 h-px bg-brand-gradient" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="hidden md:block">
          <a
            href={business.emailHref}
            className="inline-flex items-center rounded-full border border-border/70 bg-card/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-violet/60 hover:text-foreground"
          >
            Napsat e-mail
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-card/40 text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-md transition-[max-height] duration-300 md:hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <nav aria-label="Mobilní" className="px-5 pb-5 pt-2 sm:px-8">
          <ul className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = location === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-3 text-base font-medium",
                      active
                        ? "bg-card text-foreground"
                        : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li className="pt-2">
              <a
                href={business.emailHref}
                className="block rounded-md border border-border/70 bg-card/40 px-3 py-3 text-center text-base font-medium"
              >
                Napsat e-mail
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
