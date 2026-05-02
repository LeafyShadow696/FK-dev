import { useEffect } from "react"
import { business } from "@/data/business"

export interface SeoOptions {
  title: string
  description: string
  path: string
}

function setMetaByName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("name", name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setMetaByProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("property", property)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", "canonical")
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

export function useSeo({ title, description, path }: SeoOptions) {
  useEffect(() => {
    const canonical = new URL(path, business.url).toString()
    document.title = title
    setMetaByName("description", description)
    setMetaByProperty("og:title", title)
    setMetaByProperty("og:description", description)
    setMetaByProperty("og:url", canonical)
    setMetaByProperty("og:type", "website")
    setMetaByProperty("og:site_name", business.brandName)
    setMetaByProperty("og:locale", "cs_CZ")
    setMetaByProperty("og:image", `${business.url}/opengraph.jpg`)
    setMetaByName("twitter:card", "summary_large_image")
    setMetaByName("twitter:title", title)
    setMetaByName("twitter:description", description)
    setMetaByName("twitter:image", `${business.url}/opengraph.jpg`)
    setCanonical(canonical)
  }, [title, description, path])
}
