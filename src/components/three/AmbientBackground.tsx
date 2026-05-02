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

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mobile = window.matchMedia("(max-width: 768px)").matches
    setIsMobile(mobile)
    if (reduce || !detectWebGL()) {
      setEnabled(false)
      return
    }
    // Defer enabling slightly so the hero text renders first.
    const id = window.setTimeout(() => setEnabled(true), 80)
    return () => window.clearTimeout(id)
  }, [])

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
          background:
            "radial-gradient(60% 50% at 50% 30%, hsl(268 70% 60% / 0.12), transparent 65%), radial-gradient(40% 35% at 80% 70%, hsl(178 65% 55% / 0.10), transparent 70%), radial-gradient(35% 30% at 15% 85%, hsl(330 85% 65% / 0.08), transparent 70%)",
        }}
      />
      {enabled && (
        <Suspense fallback={null}>
          <NetworkScene
            className="absolute inset-0 opacity-60"
            nodeCount={isMobile ? 32 : 70}
            spread={isMobile ? 5 : 6.5}
          />
        </Suspense>
      )}
      {/* Subtle vignette to keep text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 40%, transparent 0%, hsl(240 10% 4% / 0.55) 80%, hsl(240 10% 4% / 0.85) 100%)",
        }}
      />
    </div>
  )
}
