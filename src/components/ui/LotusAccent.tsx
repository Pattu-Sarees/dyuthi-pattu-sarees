import { cn } from '@/lib/utils'

export default function LotusAccent({
  className,
  width = 22,
  color = '#C2185B',
}: {
  className?: string
  width?: number
  color?: string
}) {
  return (
    <svg
      width={width}
      height={(width * 15) / 24}
      viewBox="0 0 24 16"
      fill={color}
      aria-hidden="true"
      className={cn('block', className)}
    >
      {/* center petal */}
      <path d="M12 15 C9 10 9 4 12 1 C15 4 15 10 12 15 Z" />
      {/* inner petals */}
      <path d="M12 15 C7.5 12 4.5 7 5.5 3 C9 4 11 9.5 12 15 Z" opacity="0.85" />
      <path d="M12 15 C16.5 12 19.5 7 18.5 3 C15 4 13 9.5 12 15 Z" opacity="0.85" />
      {/* outer petals */}
      <path d="M12 15 C5 13.5 1 9.5 1 6.5 C6 6 10 10.5 12 15 Z" opacity="0.6" />
      <path d="M12 15 C19 13.5 23 9.5 23 6.5 C18 6 14 10.5 12 15 Z" opacity="0.6" />
    </svg>
  )
}
