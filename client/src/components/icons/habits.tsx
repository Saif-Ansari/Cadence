interface IconProps {
  className?: string
}

export function HabitsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <path d='M2 8l4 4 8-8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}
