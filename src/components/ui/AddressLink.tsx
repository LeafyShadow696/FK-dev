import type { ReactNode } from "react"
import { cn } from "@/utils/cn"

interface AddressLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function AddressLink({ href, children, className }: AddressLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("hover:text-foreground hover:underline", className)}
    >
      {children}
    </a>
  )
}
