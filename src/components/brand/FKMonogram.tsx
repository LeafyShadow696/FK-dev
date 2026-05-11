import { cn } from "@/utils/cn"

interface FKMonogramProps {
  className?: string
  title?: string
}

/**
 * Brand logo asset. The public component name is kept so existing layout code
 * can continue to use the same brand mark API.
 */
export function FKMonogram({ className, title = "FK monogram" }: FKMonogramProps) {
  return (
    <span
      role="img"
      aria-label={title}
      data-testid="fk-monogram"
      className={cn("inline-block overflow-hidden", className)}
    >
      <img
        src="/brand/fk-mark-light-transparent.png"
        alt=""
        className="h-full w-full object-contain dark:hidden"
        loading="eager"
        decoding="async"
      />
      <img
        src="/brand/fk-mark-dark-transparent.png"
        alt=""
        className="hidden h-full w-full object-contain dark:block"
        loading="eager"
        decoding="async"
      />
    </span>
  )
}
