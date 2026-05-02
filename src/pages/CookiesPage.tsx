import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function CookiesPage() {
  useSeo({
    title: `Zásady používání cookies | ${business.fullName}`,
    description:
      "Web fkdev.xyz aktuálně používá pouze technické cookies a obdobné technologie nezbytné pro správné fungování webu.",
    path: "/cookies",
  })

  return (
    <LegalLayout
      title="Zásady používání cookies"
      intro="Tato stránka popisuje, jak web fkdev.xyz nakládá s cookies a obdobnými technologiemi v prohlížeči."
    >
      <LegalSection title="1. Co jsou cookies">
        <p>
          Cookies jsou malé textové soubory, které do prohlížeče ukládají
          navštívené weby. Slouží především k zajištění správného fungování
          webu, k zapamatování základních nastavení nebo k analytickým a
          marketingovým účelům, pokud k nim návštěvník udělil souhlas.
        </p>
      </LegalSection>

      <LegalSection title="2. Jaké cookies web používá">
        <p>
          Web aktuálně používá pouze technické cookies nebo obdobné
          technologie nezbytné pro správné fungování, bezpečnost a základní
          provoz webu.
        </p>
      </LegalSection>

      <LegalSection title="3. Technické cookies">
        <p>
          Technické cookies jsou nezbytné pro správné zobrazení a fungování
          webu. Bez nich by web nebylo možné správně používat. K jejich použití
          není podle platné právní úpravy potřeba souhlas návštěvníka.
        </p>
      </LegalSection>

      <LegalSection title="4. Analytické a marketingové cookies">
        <p>
          Web aktuálně nepoužívá analytické ani marketingové cookies, pokud
          nejsou výslovně doplněny v budoucnu. Pokud k nasazení takových
          nástrojů v budoucnu dojde, bude tato stránka aktualizována a před
          jejich aktivací bude implementováno řízení souhlasu.
        </p>
      </LegalSection>

      <LegalSection title="5. Souhlas s cookies">
        <ul>
          <li>technické cookies souhlas nevyžadují,</li>
          <li>
            analytické a marketingové cookies vyžadují předchozí souhlas
            návštěvníka,
          </li>
          <li>
            pokud budou v budoucnu doplněny netechnické nástroje, bude nejprve
            doplněn nástroj pro správu souhlasu (consent management).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cache, localStorage, sessionStorage a obdobné technologie">
        <p>
          Prohlížeč může ukládat statické soubory webu do své vyrovnávací
          paměti (cache), například styly, skripty, obrázky a fonty. Tato cache
          slouží ke zrychlení načítání a k základnímu fungování webu.
        </p>
        <p>
          Web aktuálně záměrně nepoužívá <strong>localStorage</strong> ani{" "}
          <strong>sessionStorage</strong> pro ukládání uživatelských profilů,
          přihlášení nebo zpráv z kontaktu. Pokud by byly v budoucnu nasazeny,
          bude tato stránka aktualizována.
        </p>
      </LegalSection>

      <LegalSection title="7. Jak lze cookies spravovat">
        <p>
          Cookies a další úložiště prohlížeče lze spravovat přímo v nastavení
          internetového prohlížeče. Návštěvník je může povolit, blokovat,
          smazat nebo nastavit jejich automatické mazání po skončení relace.
          Omezení technických cookies může mít vliv na funkčnost webu.
        </p>
      </LegalSection>

      <LegalSection title="8. Budoucí změny">
        <p>
          Pokud budou v budoucnu nasazeny analytické nebo marketingové
          nástroje, bude tato stránka aktualizována a bude doplněn nástroj pro
          správu souhlasu, který umožní volbu jednotlivých kategorií cookies.
        </p>
        <p>
          V případě dotazů ke zpracování cookies a obdobných technologií se
          můžete obrátit na <a href={business.emailHref}>{business.email}</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
