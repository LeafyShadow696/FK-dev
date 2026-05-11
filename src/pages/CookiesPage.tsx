import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout"
import { business } from "@/data/business"
import { useSeo } from "@/utils/seo"

export default function CookiesPage() {
  useSeo({
    title: `Zásady používání cookies | ${business.fullName}`,
    description:
      "Web fkdev.xyz používá nezbytné technologie pro provoz webu a umožňuje návštěvníkovi spravovat předvolby a analytiku.",
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
          Web používá technické cookies nebo obdobné technologie nezbytné pro
          správné fungování, bezpečnost a základní provoz webu. Volitelně může
          návštěvník povolit uložení předvoleb a anonymní měření návštěvnosti
          a výkonu přes Vercel Analytics a Vercel Speed Insights.
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
          Web může po souhlasu návštěvníka používat Vercel Analytics a Vercel
          Speed Insights pro základní měření návštěvnosti, výkonu a
          technického stavu webu. Web aktuálně nepoužívá marketingové cookies
          ani reklamní profilování. Pokud budou v budoucnu doplněny
          marketingové nebo jiné netechnické nástroje, bude tato stránka
          aktualizována a před jejich aktivací bude vyžádán souhlas.
        </p>
      </LegalSection>

      <LegalSection title="5. Souhlas s cookies">
        <ul>
          <li>technické cookies souhlas nevyžadují,</li>
          <li>
            uložení předvolby tmavého, světlého nebo systémového režimu je
            volitelné a
            probíhá pouze při povolení kategorie předvoleb,
          </li>
          <li>
            analytika a měření výkonu se aktivují pouze po povolení analytiky,
          </li>
          <li>
            marketingové cookies a reklamní profilování vyžadují předchozí
            souhlas návštěvníka,
          </li>
          <li>
            návštěvník může nastavení kdykoliv změnit přes odkaz „Nastavení
            cookies“ v patičce webu.
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
          Web používá <strong>localStorage</strong> pro uložení samotné volby
          souhlasu. Pokud návštěvník povolí předvolby, může se do
          localStorage uložit také zvolený tmavý, světlý nebo systémový režim. Web
          nepoužívá localStorage ani sessionStorage pro ukládání uživatelských
          profilů, přihlášení nebo zpráv z kontaktu.
        </p>
      </LegalSection>

      <LegalSection title="7. Jak lze cookies spravovat">
        <p>
          Cookies a další úložiště prohlížeče lze spravovat přímo v nastavení
          internetového prohlížeče. Návštěvník je může povolit, blokovat,
          smazat nebo nastavit jejich automatické mazání po skončení relace.
          Omezení technických cookies může mít vliv na funkčnost webu.
        </p>
        <p>
          Nastavení volitelných kategorií na tomto webu lze změnit také přes
          odkaz „Nastavení cookies“ v patičce webu.
        </p>
      </LegalSection>

      <LegalSection title="8. Budoucí změny">
        <p>
          Pokud budou v budoucnu nasazeny další analytické, marketingové nebo
          reklamní nástroje, bude tato stránka aktualizována a podle potřeby
          bude doplněn nástroj pro správu souhlasu, který umožní volbu
          jednotlivých kategorií cookies.
        </p>
        <p>
          V případě dotazů ke zpracování cookies a obdobných technologií se
          můžete obrátit na <a href={business.emailHref}>{business.email}</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
