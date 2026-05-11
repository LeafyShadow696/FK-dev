import { Suspense, lazy, useEffect, useState } from "react"

const NetworkScene = lazy(() =>
  import("./NetworkScene").then((m) => ({ default: m.NetworkScene })),
)

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    return !!ctx
  } catch {
    return false
  }
}

interface AmbientBackgroundProps {
  className?: string
}

/**
 * Lightweight 3D background. Lazy-loads Three.js, respects prefers-reduced-motion,
 * scales node count down on mobile, and falls back to a CSS gradient if WebGL is unavailable.
 */
export function AmbientBackground({ className }: AmbientBackgroundProps) {
  const [enabled, setEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mobile = window.matchMedia("(max-width: 768px)").matches
    setIsMobile(mobile)
    const updateTheme = () =>
      setTheme(document.documentElement.classList.contains("light") ? "light" : "dark")
    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    if (reduce || !detectWebGL()) {
      setEnabled(false)
      return () => observer.disconnect()
    }
    // Defer enabling slightly so the hero text renders first.
    const id = window.setTimeout(() => setEnabled(true), 80)
    return () => {
      window.clearTimeout(id)
      observer.disconnect()
    }
  }, [])

  const isLight = theme === "light"

  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none absolute inset-0 overflow-hidden " +
        (className ?? "")
      }
    >
      {/* Always-on static fallback gradient; visible behind the WebGL layer. */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(50% 38% at 50% 24%, hsl(205 92% 66% / 0.14), transparent 68%), radial-gradient(36% 30% at 22% 74%, hsl(330 85% 65% / 0.10), transparent 70%), radial-gradient(34% 28% at 82% 66%, hsl(178 65% 55% / 0.12), transparent 72%)"
            : "radial-gradient(54% 42% at 50% 26%, hsl(268 70% 60% / 0.14), transparent 66%), radial-gradient(38% 30% at 78% 68%, hsl(24 96% 58% / 0.12), transparent 72%), radial-gradient(32% 28% at 18% 82%, hsl(330 85% 65% / 0.08), transparent 72%)",
        }}
      />
      {enabled && (
        <Suspense fallback={null}>
          <NetworkScene
            className="absolute inset-0 opacity-55"
            nodeCount={isMobile ? 32 : 70}
            spread={isMobile ? 5 : 6.5}
            lineColor={isLight ? "#6fb7ff" : "#fb923c"}
            nodeColor={isLight ? "#2dd4bf" : "#f97316"}
            lineOpacity={isLight ? 0.1 : 0.11}
            nodeOpacity={isLight ? 0.32 : 0.42}
          />
        </Suspense>
      )}
      {/* Subtle vignette to keep text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 40%, transparent 0%, hsl(var(--background) / 0.48) 80%, hsl(var(--background) / 0.78) 100%)",
        }}
      />
    </div>
  )
}
