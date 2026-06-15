// ----------------------------------------------------------------------------
// Elementor-style page-builder model.
//
// A page is an ordered list of SECTIONS (full-width rows). Each section holds an
// ordered list of COLUMNS whose `span` values sum to 12. Each column holds an
// ordered list of WIDGETS (the actual content atoms the user edits inline on the
// canvas).
//
// This lives alongside the older Block model so the export pipeline keeps
// working; PageData is what the new builder edits.
// ----------------------------------------------------------------------------
import { newId } from '../../types'

export const GRID = 12

export type WidgetType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'gallery'
  | 'video'
  | 'icon'
  | 'skillbar'
  | 'services'
  | 'portfolio'
  | 'contact'
  | 'spacer'
  | 'webblock' // an instance of a saved "My web block"

export interface SkillItem {
  id: string
  label: string
  pct: number
}
export interface ServiceItem {
  id: string
  icon: string
  title: string
  desc: string
}
export interface PortfolioItem {
  id: string
  image: string
  title: string
  link: string
}
export interface ContactCol {
  id: string
  label: string
  value: string
}

// A single editable content atom. Only the fields relevant to `type` are used.
export interface Widget {
  id: string
  type: WidgetType
  // text-ish
  text?: string // heading text / button label / icon char / video url / section title
  html?: string // rich text body
  level?: 1 | 2 | 3 // heading level
  // links
  url?: string // button / portfolio item link target
  // media
  src?: string // image data url
  alt?: string
  // structured
  skills?: SkillItem[]
  services?: ServiceItem[]
  items?: PortfolioItem[]
  cols?: ContactCol[]
  // spacer
  height?: number
  // webblock instance
  blockId?: string // template id in the web-block library
  // image display
  rounded?: boolean // legacy; superseded by `shape`
  shape?: 'square' | 'rounded' | 'circle'
  width?: number // image width as a percentage of its column (10–100)
  size?: number // spacer height also reuses `height`
  align?: 'left' | 'center' | 'right'
}

export interface Column {
  id: string
  span: number // 1..12; spans within a section sum to 12
  widgets: Widget[]
}

export type SectionBg = 'none' | 'soft' | 'accent' | 'dark'
export type SectionPad = 'compact' | 'normal' | 'roomy'

// A row is one horizontal band of columns inside a section. A section can stack
// several rows (e.g. "4 up / 4 down" = two rows of four columns each).
export interface Row {
  id: string
  columns: Column[]
  auto?: boolean // responsive auto-fit: columns wrap instead of a fixed 12-grid
}

export interface Section {
  id: string
  name: string // used for the nav anchor + label
  rows: Row[]
  // Legacy: older saves stored a single `columns` array directly on the section.
  columns?: Column[]
  bg?: SectionBg
  pad?: SectionPad
  full?: boolean // full-bleed (no max-width container)
  hideInNav?: boolean // when true, this section is not shown as a nav link
}

export interface PageData {
  sections: Section[]
}

// Return a section's rows, upgrading a legacy single-`columns` section on read.
export function sectionRows(sec: Section): Row[] {
  if (sec.rows && sec.rows.length) return sec.rows
  if (sec.columns && sec.columns.length) return [{ id: `${sec.id}-r0`, columns: sec.columns }]
  return []
}

export function newRow(layout: number[] = [12], auto = false): Row {
  return { id: newId(), columns: layout.map((span) => newColumn(span)), auto: auto || undefined }
}

// --- factories ---------------------------------------------------------------

export function newWidget(type: WidgetType, patch: Partial<Widget> = {}): Widget {
  const base: Widget = { id: newId(), type }
  switch (type) {
    case 'heading':
      return { ...base, text: 'Heading', level: 2, ...patch }
    case 'text':
      return { ...base, html: '<p>Write something…</p>', ...patch }
    case 'image':
      return { ...base, src: '', alt: '', ...patch }
    case 'button':
      return { ...base, text: 'Click me', url: '#', align: 'left', ...patch }
    case 'gallery':
      return { ...base, items: [], ...patch }
    case 'video':
      return { ...base, url: '', ...patch }
    case 'icon':
      return { ...base, text: '★', ...patch }
    case 'skillbar':
      return {
        ...base,
        skills: [
          { id: newId(), label: 'Design', pct: 90 },
          { id: newId(), label: 'Development', pct: 80 },
        ],
        ...patch,
      }
    case 'services':
      return {
        ...base,
        services: [
          { id: newId(), icon: 'G', title: 'Graphic Design', desc: 'Short description.' },
          { id: newId(), icon: 'W', title: 'Web Design', desc: 'Short description.' },
          { id: newId(), icon: 'B', title: 'Branding', desc: 'Short description.' },
        ],
        ...patch,
      }
    case 'portfolio':
      return { ...base, items: [], ...patch }
    case 'contact':
      return {
        ...base,
        cols: [
          { id: newId(), label: 'Call us on', value: '' },
          { id: newId(), label: 'Email us at', value: '' },
          { id: newId(), label: 'Visit office', value: '' },
        ],
        text: 'Send message',
        url: '#',
        ...patch,
      }
    case 'spacer':
      return { ...base, height: 48, ...patch }
    case 'webblock':
      return { ...base, blockId: '', ...patch }
    default:
      return base
  }
}

export function newColumn(span: number, widgets: Widget[] = []): Column {
  return { id: newId(), span, widgets }
}

let sectionCount = 0
export function newSection(layout: number[] = [12], name?: string): Section {
  sectionCount += 1
  return {
    id: newId(),
    name: name ?? `Section ${sectionCount}`,
    rows: [newRow(layout)],
    bg: 'none',
    pad: 'normal',
  }
}

// Column layout presets. `spans` sum to 12; `auto` wraps responsively for many
// equal items (galleries, logo walls, etc.).
export interface ColumnLayout {
  label: string
  spans: number[]
  auto?: boolean
}
export const COLUMN_LAYOUTS: ColumnLayout[] = [
  { label: '1', spans: [12] },
  { label: '1 / 1', spans: [6, 6] },
  { label: '1 / 1 / 1', spans: [4, 4, 4] },
  { label: '1 / 1 / 1 / 1', spans: [3, 3, 3, 3] },
  { label: '5 columns', spans: [3, 2, 2, 3, 2] },
  { label: '6 columns', spans: [2, 2, 2, 2, 2, 2] },
  { label: '2 / 1', spans: [8, 4] },
  { label: '1 / 2', spans: [4, 8] },
  { label: 'Auto-fit', spans: [4, 4, 4], auto: true },
]

export const WIDGET_GROUPS: {
  group: string
  items: { type: WidgetType; label: string }[]
}[] = [
  {
    group: 'Core',
    items: [
      { type: 'heading', label: 'Heading' },
      { type: 'text', label: 'Text' },
      { type: 'image', label: 'Image' },
      { type: 'button', label: 'Button' },
    ],
  },
  {
    group: 'Media',
    items: [
      { type: 'gallery', label: 'Gallery' },
      { type: 'video', label: 'Video' },
      { type: 'icon', label: 'Icon' },
      { type: 'spacer', label: 'Spacer' },
    ],
  },
  {
    group: 'Portfolio',
    items: [
      { type: 'skillbar', label: 'Skill bars' },
      { type: 'services', label: 'Services grid' },
      { type: 'portfolio', label: 'Portfolio grid' },
      { type: 'contact', label: 'Contact band' },
    ],
  },
]

export const WIDGET_LABELS: Record<WidgetType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  gallery: 'Gallery',
  video: 'Video',
  icon: 'Icon',
  skillbar: 'Skill bars',
  services: 'Services grid',
  portfolio: 'Portfolio grid',
  contact: 'Contact band',
  spacer: 'Spacer',
  webblock: 'Web block',
}
