interface IconProps {
  className?: string
}

export function ReflectionsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <rect x='2' y='1' width='12' height='14' rx='1' stroke='currentColor' strokeWidth='1.5' />
      <path d='M5 5h6M5 8h6M5 11h4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  )
}
