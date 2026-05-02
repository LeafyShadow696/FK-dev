import { useEffect } from "react"
import { useLocation } from "wouter"

export function ScrollToTop() {
  const [location] = useLocation()
  useEffect(() => {
    if (typeof window === "undefined") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "auto" })
  }, [location])
  return null
}
