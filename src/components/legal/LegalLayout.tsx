import type { ReactNode } from "react"
import { Section } from "@/components/ui/Section"

interface LegalLayoutProps {
  eyebrow?: string
  title: string
  intro?: ReactNode
  children: ReactNode
}

export function LegalLayout({
  eyebrow = "Právní informace",
  title,
  intro,
  children,
}: LegalLayoutProps) {
  return (
    <main className="pt-32">
      <Section className="!py-12 sm:!py-16">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-6 bg-brand-gradient" />
            {eyebrow}
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient-brand">{title}</span>
          </h1>
          {intro && (
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {intro}
            </p>
          )}
        </div>
      </Section>

      <Section className="!pt-0">
        <article className="mx-auto max-w-3xl">
          <div className="legal-prose space-y-10">{children}</div>
        </article>
      </Section>
    </main>
  )
}

interface LegalSectionProps {
  title: string
  children: ReactNode
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base [&_a]:text-foreground [&_a:hover]:underline [&_strong]:text-foreground [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
        {children}
      </div>
    </section>
  )
}
