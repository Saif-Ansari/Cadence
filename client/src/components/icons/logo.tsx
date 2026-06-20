interface IconProps {
  className?: string
}

export function LogoBarsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <rect x='1' y='10' width='3' height='5' rx='1' fill='white' />
      <rect x='6' y='6' width='3' height='9' rx='1' fill='white' />
      <rect x='11' y='2' width='3' height='13' rx='1' fill='white' />
    </svg>
  )
}
