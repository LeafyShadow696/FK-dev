import { cn } from "@/utils/cn"

interface FKMonogramProps {
  className?: string
  title?: string
}

/**
 * FK monogram — script-style "FK" lockup inspired by the brand reference.
 * Uses a multi-stop gradient (pink → violet → teal) that mirrors the logo.
 */
export function FKMonogram({ className, title = "FK monogram" }: FKMonogramProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      className={cn("h-auto w-auto", className)}
    >
      <defs>
        <linearGradient id="fk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(330 85% 65%)" />
          <stop offset="50%" stopColor="hsl(268 70% 60%)" />
          <stop offset="100%" stopColor="hsl(178 65% 55%)" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#fk-grad)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* F — flowing script vertical with elegant curl and crossbar */}
        <path
          d="M86 32 C 76 36, 70 50, 70 70 L 70 168 C 70 178, 64 184, 56 184"
          strokeWidth="7"
        />
        <path d="M64 86 L 100 86" strokeWidth="6" />
        <path
          d="M86 32 C 96 28, 108 32, 112 42"
          strokeWidth="6"
        />

        {/* K — script-style: vertical stem with two flowing arms */}
        <path
          d="M126 56 L 126 168"
          strokeWidth="7"
        />
        <path
          d="M126 110 C 140 108, 152 96, 158 80 C 162 70, 158 60, 150 58"
          strokeWidth="6"
        />
        <path
          d="M126 110 C 142 116, 156 130, 162 152 C 166 166, 160 178, 148 178"
          strokeWidth="6"
        />
      </g>
    </svg>
  )
}
