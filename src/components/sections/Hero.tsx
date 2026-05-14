import { motion } from "framer-motion"
import { ArrowRight, Mail, Phone } from "lucide-react"
import {
  ButtonLink,
  ButtonRouterLink,
} from "@/components/ui/Button"
import { AmbientBackground } from "@/components/three/AmbientBackground"
import { business } from "@/data/business"
import { usePublishedContent } from "@/hooks/usePublishedContent"

export function Hero() {
  const publishedContent = usePublishedContent()
  const heroLead =
    publishedContent["hero.lead"] ||
    "Navrhuji a stavím weby, PWA, interní nástroje a automatizace pro podnikatele a menší firmy, které potřebují jasný výstup, rychlé spuštění a řešení použitelné i po předání."

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24">
      <AmbientBackground />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
            {business.brandName}
          </span>

          <h1 className="brand-script text-6xl text-balance sm:text-7xl md:text-8xl">
            <span className="signature-gradient">{business.legalName}</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg italic text-muted-foreground sm:text-xl">
            &ldquo;{business.motto}&rdquo;
          </p>

          <p className="mt-8 max-w-2xl text-pretty text-base leading-relaxed text-foreground/90 sm:text-lg">
            {heroLead}
          </p>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pomohu vám převést nápad, nefunkční proces nebo technickou nejistotu
            do konkrétního plánu, priorit a prvního funkčního kroku.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <ButtonLink href={business.emailHref} variant="primary">
              <Mail className="h-4 w-4" aria-hidden />
              Chci konzultaci
            </ButtonLink>
            <ButtonLink href={business.phoneHref} variant="secondary">
              <Phone className="h-4 w-4" aria-hidden />
              Zavolat
            </ButtonLink>
            <ButtonRouterLink to="/sluzby" variant="ghost">
              Mám projekt
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonRouterLink>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
