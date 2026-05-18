import { Route, Switch, useLocation } from "wouter"
import { useEffect } from "react"
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
import PortalPage from "@/pages/PortalPage"
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

function LiveTelemetry() {
  const { consent } = useConsent()
  const [location] = useLocation()

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !["fkdev.xyz", "www.fkdev.xyz"].includes(window.location.hostname) ||
      !consent.analytics
    ) {
      return
    }

    const storageKey = "fkdev-telemetry-session"
    let existing = ""

    try {
      existing = window.localStorage.getItem(storageKey) ?? ""
    } catch {
      existing = ""
    }

    const sessionId =
      existing ||
      window.crypto.getRandomValues(new Uint32Array(4)).join("").slice(0, 48)

    if (!existing) {
      try {
        window.localStorage.setItem(storageKey, sessionId)
      } catch {
        // The current in-memory session still provides anonymous aggregation.
      }
    }

    const payload = {
      sessionId,
      eventType: "page_view",
      path: window.location.pathname,
      referrer:
        document.referrer && new URL(document.referrer).hostname !== window.location.hostname
          ? new URL(document.referrer).hostname
          : "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    }

    window.setTimeout(() => {
      void fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    }, 0)
  }, [consent.analytics, location])

  return null
}

function AppContent() {
  return (
    <>
      <JsonLd />
      <ScrollToTop />
      <VercelInsights />
      <LiveTelemetry />
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
          <Route path="/portal" component={PortalPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </div>
      <Footer />
    </>
  )
}

export default function App() {
  const [location] = useLocation()

  if (location === "/portal") {
    return (
      <>
        <ScrollToTop />
        <div id="main">
          <PortalPage />
        </div>
      </>
    )
  }

  return (
    <ConsentProvider>
      <AppContent />
    </ConsentProvider>
  )
}
