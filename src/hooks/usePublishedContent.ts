import { useEffect, useState } from "react"

type PublishedContent = Record<string, string>

let contentCache: PublishedContent | null = null

function shouldLoadPublishedContent() {
  const host = window.location.hostname

  return host !== "127.0.0.1" && host !== "localhost"
}

export function usePublishedContent() {
  const [content, setContent] = useState<PublishedContent>(
    () => contentCache ?? {},
  )

  useEffect(() => {
    let active = true

    async function loadContent() {
      if (!shouldLoadPublishedContent()) {
        return
      }

      try {
        const response = await fetch("/api/content", {
          headers: {
            Accept: "application/json",
          },
        })
        const data = (await response.json()) as { content?: PublishedContent }
        const next =
          data.content && typeof data.content === "object" ? data.content : {}

        contentCache = next

        if (active) {
          setContent(next)
        }
      } catch {
        if (active) {
          setContent(contentCache ?? {})
        }
      }
    }

    void loadContent()

    return () => {
      active = false
    }
  }, [])

  return content
}
