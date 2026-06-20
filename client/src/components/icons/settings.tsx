interface IconProps {
  className?: string
}

export function SettingsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none'>
      <path d='M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' stroke='currentColor' strokeWidth='1.5' />
      <path d='M13.3 6.6l-.8-1.9-1.5.5a4.3 4.3 0 0 0-1-.6l-.2-1.6H6.2l-.2 1.6c-.4.1-.7.3-1 .6l-1.5-.5-.8 1.9 1.3.9v1l-1.3.9.8 1.9 1.5-.5c.3.3.6.5 1 .6l.2 1.6h3.6l.2-1.6c.4-.1.7-.3 1-.6l1.5.5.8-1.9-1.3-.9v-1l1.3-.9z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
    </svg>
  )
}
