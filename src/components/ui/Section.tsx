import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/utils/cn"

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

export function Section({ className, children, ...props }: SectionProps) {
  return (
    <section
      {...props}
      className={cn("relative py-20 sm:py-28", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  )
}

interface SectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: "start" | "center"
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px w-6 bg-brand-gradient" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  )
}
