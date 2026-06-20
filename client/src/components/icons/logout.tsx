interface IconProps {
  className?: string
}

export function LogOutIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <path d='M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}
