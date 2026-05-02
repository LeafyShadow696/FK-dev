import { Section, SectionHeader } from "@/components/ui/Section"
import { business } from "@/data/business"

export function TechStack() {
  return (
    <Section id="technologie">
      <SectionHeader
        eyebrow="Expertise"
        title={
          <>
            Technologie a <span className="text-gradient-brand">nástroje</span>
          </>
        }
        description="Stack zaměřený na produktivitu, výkon a dlouhodobou udržitelnost — od front-endu přes automatizace až po cloud."
      />

      <div className="mt-12 flex flex-wrap gap-2.5">
        {business.technologies.map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-border/70 bg-card/40 px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-brand-violet/50 hover:text-foreground"
          >
            {tech}
          </span>
        ))}
      </div>
    </Section>
  )
}
