import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function TermsPage() {
  useSeo({
    title: `Podmínky použití webu | ${business.fullName}`,
    description:
      "Podmínky použití webu fkdev.xyz, informativní charakter obsahu, rozsah služeb a obecná pravidla využití.",
    path: "/podminky-pouziti",
  })

  return (
    <LegalLayout
      title="Podmínky použití webu"
      intro="Tyto podmínky popisují obecná pravidla pro používání webu fkdev.xyz a informativní charakter zveřejněného obsahu."
    >
      <LegalSection title="1. Úvod">
        <p>
          Tento web prezentuje služby a profesní činnost{" "}
          <strong>{business.fullName}</strong>. Slouží jako veřejná
          prezentace činnosti, kontaktních údajů a obecného zaměření.
        </p>
      </LegalSection>

      <LegalSection title="2. Informativní charakter obsahu">
        <p>
          Obsah webu má obecný informativní charakter. Neobsahuje právní,
          daňové, účetní ani jiné specializované poradenství a nelze jej
          zaměňovat za individuální odbornou konzultaci.
        </p>
      </LegalSection>

      <LegalSection title="3. Poptávky a komunikace">
        <p>
          Odeslání e-mailu nebo telefonický kontakt nezakládá automaticky
          smluvní vztah. Konkrétní podmínky spolupráce jsou vždy předmětem
          individuální dohody mezi provozovatelem a klientem.
        </p>
      </LegalSection>

      <LegalSection title="4. Rozsah služeb">
        <p>
          Konkrétní rozsah služeb, výstupy, termíny a cena jsou sjednávány
          individuálně dle povahy projektu a požadavků klienta. Web obsahuje
          obecný popis možných služeb, nikoli závaznou nabídku.
        </p>
      </LegalSection>

      <LegalSection title="5. Dostupnost webu">
        <p>
          Provozovatel se snaží web udržovat dostupný a obsah aktuální,
          neposkytuje však záruku nepřetržité dostupnosti, bezchybnosti ani
          úplné aktuálnosti všech informací.
        </p>
      </LegalSection>

      <LegalSection title="6. Odpovědnost">
        <p>
          Provozovatel neodpovídá za škody vzniklé v důsledku používání nebo
          nemožnosti použít web či informace zde zveřejněné, a to v rozsahu
          dovoleném platnou právní úpravou. Tímto nejsou dotčena práva
          spotřebitelů.
        </p>
      </LegalSection>

      <LegalSection title="7. Duševní vlastnictví">
        <p>
          Texty, vizuální styl, grafické prvky, prezentace značky a logo,
          uspořádání stránek a další obsah jsou chráněny příslušnými právními
          předpisy. Bez předchozího souhlasu není možné je kopírovat, dále
          šířit ani jinak užívat nad rámec běžného prohlížení webu.
        </p>
      </LegalSection>

      <LegalSection title="8. Externí odkazy">
        <p>
          Web může obsahovat odkazy na webové stránky třetích stran.
          Provozovatel neodpovídá za jejich obsah, dostupnost ani za
          zpracování osobních údajů na těchto externích webech.
        </p>
      </LegalSection>

      <LegalSection title="9. Změny obsahu">
        <p>
          Obsah webu, prezentované služby a tyto podmínky mohou být průběžně
          aktualizovány. Doporučujeme se s aktuálním zněním seznámit při každé
          další návštěvě.
        </p>
      </LegalSection>

      <LegalSection title="10. Kontakt">
        <p>
          V případě dotazů k podmínkám použití nebo obsahu webu se můžete
          obrátit na <a href={business.emailHref}>{business.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="11. Informační právní poznámka">
        <p>
          Texty na tomto webu mají informativní charakter a před ostrým
          produkčním použitím mohou být vhodné k právní kontrole.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
