import { useEffect } from "react"
import { buildProfessionalServiceJsonLd } from "@/utils/structuredData"

const ID = "ld-professional-service"

export function JsonLd() {
  useEffect(() => {
    let el = document.getElementById(ID) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement("script")
      el.id = ID
      el.type = "application/ld+json"
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(buildProfessionalServiceJsonLd())
  }, [])
  return null
}
