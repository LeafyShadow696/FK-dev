import { CollaborationModels } from "@/components/sections/CollaborationModels"
import { CollaborationProcess } from "@/components/sections/CollaborationProcess"
import { FAQ } from "@/components/sections/FAQ"
import { ProjectOutcomes } from "@/components/sections/ProjectOutcomes"
import { TechStack } from "@/components/sections/TechStack"
import { WhyMe } from "@/components/sections/WhyMe"
import { Section, SectionHeader } from "@/components/ui/Section"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function CollaborationPage() {
  useSeo({
    title: `Spolupráce | ${business.fullName}`,
    description:
      "Jak probíhá spolupráce na webových aplikacích, automatizacích a technických konzultacích: modely spolupráce, proces, výstupy, technologie a FAQ.",
    path: "/spoluprace",
  })

  return (
    <main className="pt-32">
      <Section className="!py-12 sm:!py-16">
        <SectionHeader
          as="h1"
          eyebrow="Spolupráce"
          title={
            <>
              Od prvního zadání po{" "}
              <span className="text-gradient-brand">předání řešení</span>
            </>
          }
          description="Přehled toho, jak spolupráce začíná, jaké modely dávají smysl, co má být na konci hotové a podle čeho se projekt drží pod kontrolou."
        />
      </Section>

      <CollaborationModels />
      <CollaborationProcess />
      <ProjectOutcomes />
      <WhyMe />
      <TechStack />
      <FAQ />
    </main>
  )
}
