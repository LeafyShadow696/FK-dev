import { Route, Switch } from "wouter"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ScrollToTop } from "@/components/layout/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import { ConsentProvider, useConsent } from "@/components/privacy/ConsentProvider"
import HomePage from "@/pages/HomePage"
import ServicesPage from "@/pages/ServicesPage"
import CollaborationPage from "@/pages/CollaborationPage"
import ExamplesPage from "@/pages/ExamplesPage"
import ContactPage from "@/pages/ContactPage"
import LegalPage from "@/pages/LegalPage"
import PrivacyPage from "@/pages/PrivacyPage"
import CookiesPage from "@/pages/CookiesPage"
import TermsPage from "@/pages/TermsPage"
import NotFoundPage from "@/pages/NotFoundPage"

function VercelInsights() {
  const { consent } = useConsent()

  if (
    typeof window === "undefined" ||
    !["fkdev.xyz", "www.fkdev.xyz"].includes(window.location.hostname) ||
    !consent.analytics
  ) {
    return null
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}

function AppContent() {
  return (
    <>
      <JsonLd />
      <ScrollToTop />
      <VercelInsights />
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
          <Route path="/spoluprace" component={CollaborationPage} />
          <Route path="/priklady" component={ExamplesPage} />
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

export default function App() {
  return (
    <ConsentProvider>
      <AppContent />
    </ConsentProvider>
  )
}
