import { ThemeToggle as SharedThemeToggle } from '@openpub/ui/theme-toggle'

export function ThemeToggle({ className = '' }: { className?: string }) {
  return <SharedThemeToggle className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-(--border) text-(--dim2) transition-colors hover:text-(--fg3) hover:border-(--surface4) [&_svg]:h-3.5 [&_svg]:w-3.5 ${className}`} />
}
