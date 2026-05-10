import { cn } from "@/utils/cn"

interface FKMonogramProps {
  className?: string
  title?: string
}

/**
 * FK monogram — script-style "FK" lockup inspired by the brand reference.
 * Uses direct stroke colors instead of SVG gradient URLs so iOS Safari renders it reliably.
 */
export function FKMonogram({ className, title = "FK monogram" }: FKMonogramProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      data-testid="fk-monogram"
      className={cn("h-auto w-auto", className)}
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* F — flowing script vertical with elegant curl and crossbar */}
        <path
          d="M86 32 C 76 36, 70 50, 70 70 L 70 168 C 70 178, 64 184, 56 184"
          stroke="#f25aa6"
          strokeWidth="7"
        />
        <path d="M64 86 L 100 86" stroke="#b05ee7" strokeWidth="6" />
        <path
          d="M86 32 C 96 28, 108 32, 112 42"
          stroke="#8c5add"
          strokeWidth="6"
        />

        {/* K — script-style: vertical stem with two flowing arms */}
        <path
          d="M126 56 L 126 168"
          stroke="#7a78e8"
          strokeWidth="7"
        />
        <path
          d="M126 110 C 140 108, 152 96, 158 80 C 162 70, 158 60, 150 58"
          stroke="#5aa6e8"
          strokeWidth="6"
        />
        <path
          d="M126 110 C 142 116, 156 130, 162 152 C 166 166, 160 178, 148 178"
          stroke="#3ed9cf"
          strokeWidth="6"
        />
      </g>
    </svg>
  )
}
