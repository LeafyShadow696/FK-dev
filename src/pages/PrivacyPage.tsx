import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout"
import { AddressLink } from "@/components/ui/AddressLink"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function PrivacyPage() {
  useSeo({
    title: `Ochrana osobních údajů | ${business.fullName}`,
    description:
      "Zásady zpracování osobních údajů na webu fkdev.xyz. Web nepoužívá vlastní kontaktní formulář a kontakt probíhá přímo přes e-mail nebo telefon.",
    path: "/ochrana-osobnich-udaju",
  })

  return (
    <LegalLayout
      title="Ochrana osobních údajů"
      intro="Tento dokument popisuje, jaké osobní údaje mohou být zpracovávány v souvislosti s návštěvou webu fkdev.xyz a komunikací s provozovatelem."
    >
      <LegalSection title="1. Správce osobních údajů">
        <p>Správcem osobních údajů je:</p>
        <ul>
          <li>{business.legalName}</li>
          <li>{business.brandName}</li>
          <li>
            <strong>IČO:</strong> {business.ico}
          </li>
          <li>
            <strong>Sídlo dle živnostenského rejstříku:</strong>{" "}
            <AddressLink href={business.registeredOffice.mapsHref}>
              {business.registeredOffice.full}
            </AddressLink>
          </li>
          <li>
            <strong>Kontaktní adresa:</strong>{" "}
            <AddressLink href={business.address.mapsHref}>
              {business.address.full}
            </AddressLink>
          </li>
          <li>
            <strong>E-mail:</strong>{" "}
            <a href={business.emailHref}>{business.email}</a>
          </li>
          <li>
            <strong>Telefon:</strong>{" "}
            <a href={business.phoneHref}>{business.phone}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Jaké údaje mohou být zpracovávány">
        <p>
          Osobní údaje mohou být zpracovávány v případě, že návštěvník
          kontaktuje provozovatele přímo e-mailem nebo telefonicky. V takovém
          případě se může jednat zejména o tyto údaje:
        </p>
        <ul>
          <li>jméno a příjmení</li>
          <li>e-mailová adresa</li>
          <li>telefonní číslo</li>
          <li>obsah komunikace</li>
          <li>
            informace o projektu nebo poptávce dobrovolně poskytnuté
            návštěvníkem
          </li>
          <li>
            technické údaje nezbytné pro bezpečný provoz webu, například IP
            adresa, serverové logy, typ prohlížeče nebo zařízení
          </li>
          <li>
            agregované údaje o návštěvnosti a výkonu webu z nástrojů Vercel
            Analytics a Vercel Speed Insights, pokud návštěvník povolí
            analytiku
          </li>
          <li>
            informace uložené v prohlížeči pro správu souhlasu a případně pro
            zapamatování světlého nebo tmavého režimu
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Účely zpracování">
        <ul>
          <li>odpověď na dotaz</li>
          <li>příprava nabídky</li>
          <li>jednání o spolupráci</li>
          <li>plnění smlouvy</li>
          <li>plnění zákonných povinností</li>
          <li>ochrana právních nároků</li>
          <li>bezpečný provoz webu</li>
          <li>správa souhlasu a volitelných předvoleb webu</li>
          <li>měření návštěvnosti, výkonu a stability webu po udělení souhlasu</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Právní základy zpracování">
        <ul>
          <li>jednání o smlouvě nebo plnění smlouvy</li>
          <li>
            oprávněný zájem na komunikaci, ochraně právních nároků a bezpečném
            provozu webu
          </li>
          <li>souhlas pro volitelné předvolby a analytiku</li>
          <li>splnění právních povinností</li>
          <li>
            souhlas, pokud by byl v budoucnu použit pro marketing nebo
            netechnické cookies
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Doba uchování">
        <p>
          Osobní údaje jsou uchovávány pouze po dobu nezbytnou pro vyřízení
          komunikace, přípravu nabídky, případnou spolupráci, plnění zákonných
          povinností nebo ochranu právních nároků. Po pominutí účelu jsou údaje
          vymazány nebo anonymizovány.
        </p>
      </LegalSection>

      <LegalSection title="6. Komu mohou být údaje zpřístupněny">
        <p>
          Osobní údaje mohou být v nezbytném rozsahu zpřístupněny pouze
          obecným kategoriím zpracovatelů, například:
        </p>
        <ul>
          <li>poskytovatel hostingu</li>
          <li>poskytovatel analytiky a měření výkonu webu</li>
          <li>poskytovatel e-mailových služeb</li>
          <li>technická správa webu</li>
          <li>účetní nebo právní poradce, pokud je to nutné</li>
        </ul>
        <p>
          Pro hosting, základní webovou analytiku a měření výkonu může být
          využívána platforma Vercel. Další konkrétní zpracovatelé budou
          případně doplněni podle skutečného technického nasazení.
        </p>
      </LegalSection>

      <LegalSection title="7. Web bez kontaktního formuláře">
        <p>
          Web neprovozuje vlastní kontaktní formulář pro ukládání zpráv do
          databáze. Kontakt probíhá přímo přes e-mailového klienta návštěvníka
          nebo telefon. Stažení digitální vizitky vCard pouze předá veřejné
          kontaktní údaje provozovatele do zařízení návštěvníka; web tím
          neukládá kontakt návštěvníka do vlastní databáze.
        </p>
      </LegalSection>

      <LegalSection title="8. Práva subjektu údajů">
        <ul>
          <li>právo na přístup</li>
          <li>právo na opravu</li>
          <li>právo na výmaz</li>
          <li>právo na omezení zpracování</li>
          <li>právo vznést námitku</li>
          <li>právo na přenositelnost, pokud je použitelné</li>
          <li>
            právo odvolat souhlas, pokud je zpracování založené na souhlasu
          </li>
          <li>
            právo podat stížnost u Úřadu pro ochranu osobních údajů (ÚOOÚ)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Kontakt pro ochranu soukromí">
        <p>
          Ve věci ochrany osobních údajů se na nás můžete obrátit na e-mailu{" "}
          <a href={business.emailHref}>{business.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="10. Změny zásad">
        <p>
          Tyto zásady mohou být průběžně aktualizovány zejména v souvislosti se
          změnami funkčnosti webu, technického nasazení nebo platné právní
          úpravy.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
