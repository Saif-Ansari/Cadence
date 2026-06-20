interface IconProps {
  className?: string
}

export function GoalsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
      <circle cx='8' cy='8' r='3' stroke='currentColor' strokeWidth='1.5' />
      <circle cx='8' cy='8' r='1' fill='currentColor' />
    </svg>
  )
}
