// Small inline SVG icons used in the resume contact line.
// 1em sized so they scale with the resume font.

type IconProps = { className?: string }

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function MailIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  )
}

export function PhoneIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

export function PinIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function GlobeIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  )
}

export function LinkedInIcon(p: IconProps) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18.34v-7.2H6V18.3h2.34Zm-1.17-8.2a1.36 1.36 0 1 0 0-2.72 1.36 1.36 0 0 0 0 2.72ZM18 18.34v-3.94c0-2.1-.45-3.72-2.9-3.72-1.18 0-1.97.65-2.3 1.26h-.03v-1.07H10.5V18.3h2.34v-3.56c0-.94.18-1.85 1.34-1.85 1.15 0 1.16 1.07 1.16 1.9v3.55H18Z" />
    </svg>
  )
}

export function GithubIcon(p: IconProps) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

export function FileIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

export function DownloadIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  )
}

export function MoonIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  )
}

export function SunIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function PlusIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function TrashIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}

export function ImageIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

export function GoogleIcon(p: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" className={p.className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 4.5 29.5 2.5 24 2.5 12.1 2.5 2.5 12.1 2.5 24S12.1 45.5 24 45.5 45.5 35.9 45.5 24c0-1.2-.1-2.3-.3-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M5.3 14.7l6.6 4.8C13.6 16 18.4 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 4.5 29.5 2.5 24 2.5 16 2.5 9.1 7 5.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.4 0 10.3-2.1 14-5.4l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9 41 15.9 45.5 24 45.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.5 5.5c-.5.4 7-5.1 7-15.1 0-1.2-.1-2.3-.3-3.5z"
      />
    </svg>
  )
}

export function AlignLeftIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M3 6h18M3 12h12M3 18h15" />
    </svg>
  )
}

export function AlignCenterIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M3 6h18M6 12h12M4 18h16" />
    </svg>
  )
}

export function AlignRightIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M3 6h18M9 12h12M6 18h15" />
    </svg>
  )
}

export function MenuIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function HeartIcon(p: IconProps) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
      <path d="M12 21s-6.7-4.35-9.33-8.07C.9 10.27 1.5 6.9 4.1 5.6c1.95-.98 4.04-.3 5.4 1.27L12 9.5l2.5-2.63c1.36-1.57 3.45-2.25 5.4-1.27 2.6 1.3 3.2 4.67 1.43 7.33C18.7 16.65 12 21 12 21Z" />
    </svg>
  )
}

export function CoffeeIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  )
}

export function BlocksIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function ChevronIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function BoldIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />
    </svg>
  )
}

export function ItalicIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M19 4h-9M14 20H5M15 4 9 20" />
    </svg>
  )
}

export function ListIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

export function LinkIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  )
}

export function TableIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  )
}

export function LayoutIcon(p: IconProps) {
  return (
    <svg {...base} className={p.className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </svg>
  )
}

export function GripIcon(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}
