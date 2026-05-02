import { Route, Switch } from "wouter"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ScrollToTop } from "@/components/layout/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import HomePage from "@/pages/HomePage"
import ServicesPage from "@/pages/ServicesPage"
import ContactPage from "@/pages/ContactPage"
import LegalPage from "@/pages/LegalPage"
import PrivacyPage from "@/pages/PrivacyPage"
import CookiesPage from "@/pages/CookiesPage"
import TermsPage from "@/pages/TermsPage"
import NotFoundPage from "@/pages/NotFoundPage"

export default function App() {
  return (
    <>
      <JsonLd />
      <ScrollToTop />
      <Analytics />
      <SpeedInsights />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Přeskočit na obsah
      </a>
      <Header />
      <div id="main">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/sluzby" component={ServicesPage} />
          <Route path="/kontakt" component={ContactPage} />
          <Route path="/pravni-udaje" component={LegalPage} />
          <Route path="/ochrana-osobnich-udaju" component={PrivacyPage} />
          <Route path="/cookies" component={CookiesPage} />
          <Route path="/podminky-pouziti" component={TermsPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </div>
      <Footer />
    </>
  )
}
