import { cn } from "@/utils/cn"
import { business } from "@/data/business"

interface WordmarkProps {
  className?: string
  align?: "start" | "center"
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: { name: "text-base sm:text-lg", brand: "text-[11px] sm:text-xs" },
  md: { name: "text-2xl sm:text-3xl", brand: "text-xs sm:text-sm" },
  lg: { name: "text-4xl sm:text-5xl md:text-6xl", brand: "text-sm sm:text-base" },
}

export function Wordmark({
  className,
  align = "start",
  size = "md",
}: WordmarkProps) {
  const s = sizeMap[size]
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <span
        className={cn(
          "font-display font-semibold tracking-tight text-gradient-brand",
          s.name,
        )}
      >
        {business.legalName}
      </span>
      <span
        className={cn(
          "font-sans font-medium uppercase tracking-[0.22em] text-muted-foreground",
          s.brand,
        )}
      >
        {business.brandName}
      </span>
    </div>
  )
}
