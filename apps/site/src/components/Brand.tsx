import type { CSSProperties } from 'react'

export const platforms = [
  { name: 'dev.to', logo: 'devto', hex: '#0A0A0A' },
  { name: 'Hashnode', logo: 'hashnode', hex: '#2962FF' },
  { name: 'WordPress', logo: 'wordpress', hex: '#21759B' },
  { name: 'Ghost', logo: 'ghost', hex: '#15171A' },
  { name: 'Medium', logo: 'medium', hex: '#000000' },
  { name: 'Substack', logo: 'substack', hex: '#FF6719' },
  { name: 'Your Pages', logo: 'github', hex: '#181717' },
  { name: 'X Articles', logo: 'x', hex: '#000000' },
]

// SVG used as a mask so one file can render in any color (brand hex or currentColor).
export function BrandIcon({ logo, color }: { logo: string; color?: string }) {
  return <i aria-hidden="true" className="brand-icon" style={{ '--logo': `url(/logos/${logo}.svg)`, color } as CSSProperties} />
}

export function Tile({ name }: { name: string }) {
  const p = platforms.find(item => item.name === name)!
  return <span className="platform-tile"><BrandIcon logo={p.logo} color={p.hex} />{name}</span>
}
