import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function LegalPage() {
  useSeo({
    title: `Právní údaje | ${business.fullName}`,
    description:
      "Provozovatel webu fkdev.xyz, kontaktní údaje a obecný popis činnosti František Kalášek / TopBot PwnZ™.",
    path: "/pravni-udaje",
  })

  return (
    <LegalLayout
      title="Právní údaje"
      intro="Přehled provozovatele webu fkdev.xyz, kontaktních údajů a obecného zaměření činnosti."
    >
      <LegalSection title="Provozovatel webu">
        <ul>
          <li>
            <strong>Jméno:</strong> {business.legalName}
          </li>
          <li>
            <strong>Brand:</strong> {business.brandName}
          </li>
          <li>
            <strong>Kontaktní adresa:</strong> {business.address.full}
          </li>
          <li>
            <strong>E-mail:</strong>{" "}
            <a href={business.emailHref}>{business.email}</a>
          </li>
          <li>
            <strong>Telefon:</strong>{" "}
            <a href={business.phoneHref}>{business.phone}</a>
          </li>
          <li>
            <strong>Web:</strong>{" "}
            <a href={business.url}>{business.url}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Zaměření činnosti">
        <ul>
          {business.focus.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Profil činnosti">
        <p>{business.description}</p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          Informace na tomto webu mají obecný informační charakter. Konkrétní
          rozsah služeb, cena, termíny a podmínky spolupráce jsou vždy řešeny
          individuálně podle dohody.
        </p>
      </LegalSection>

      <LegalSection title="Právní poznámka">
        <p>
          Texty na tomto webu mají informační charakter a před ostrým produkčním
          použitím mohou být vhodné k právní kontrole.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
