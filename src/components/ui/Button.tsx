import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "wouter"
import { cn } from "@/utils/cn"

type Variant = "primary" | "secondary" | "ghost"

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-[0_10px_30px_-10px_hsl(268_70%_60%/0.6)] hover:shadow-[0_15px_40px_-10px_hsl(268_70%_60%/0.7)] hover:-translate-y-0.5 focus-visible:ring-brand-violet",
  secondary:
    "border border-border/70 bg-card/40 text-foreground hover:border-brand-violet/60 hover:bg-card/70 focus-visible:ring-brand-violet/60",
  ghost:
    "text-foreground hover:bg-card/60 focus-visible:ring-brand-violet/40",
}

interface BaseProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>
type AnchorProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean }
type LinkProps = BaseProps & { to: string }

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  external,
  children,
  ...props
}: AnchorProps) {
  return (
    <a
      {...props}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </a>
  )
}

export function ButtonRouterLink({
  variant = "primary",
  className,
  to,
  children,
}: LinkProps) {
  return (
    <Link href={to} className={cn(baseStyles, variants[variant], className)}>
      {children}
    </Link>
  )
}
