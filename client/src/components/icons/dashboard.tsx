interface IconProps {
  className?: string
}

export function DashboardIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <rect x='1' y='1' width='6' height='6' rx='1' fill='currentColor' />
      <rect x='9' y='1' width='6' height='6' rx='1' fill='currentColor' />
      <rect x='1' y='9' width='6' height='6' rx='1' fill='currentColor' />
      <rect x='9' y='9' width='6' height='6' rx='1' fill='currentColor' />
    </svg>
  )
}
