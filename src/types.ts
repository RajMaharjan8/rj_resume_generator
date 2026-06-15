// ----------------------------------------------------------------------------
// Schema-driven resume model.
//
// A resume is an ordered list of BLOCKS. Each block has a SCHEMA (ordered field
// definitions) and a VALUES bag keyed by field id. Built-in blocks mark their
// core fields `locked: true` — those can't be removed, but users can append new
// fields. Custom blocks are fully user-defined.
// ----------------------------------------------------------------------------

export type FieldType =
  | 'text'
  | 'textarea'
  | 'tags'
  | 'image'
  | 'repeater'
  | 'list'
  | 'date'
  | 'button'
  | 'skillbar'

export interface FieldDef {
  id: string
  type: FieldType
  label: string
  locked?: boolean // built-in field — cannot be deleted
  alignRight?: boolean // float this field to the right of its row (e.g. a date)
  // For repeater fields: the schema of each row.
  fields?: FieldDef[]
}

// A value can be a string (text/textarea[html]/image), string[] (tags/list), or
// an array of rows (repeater), each row a record of fieldId -> string/string[].
export type RepeaterRow = Record<string, string | string[]>
export type FieldValue = string | string[] | RepeaterRow[]

export interface ImageMeta {
  size?: number // rendered width in px (default 120)
  shape?: 'square' | 'circle' | 'rounded'
}

export const GRID_COLS = 12

// Placement of a custom-block field on the 12-column layout grid.
export interface GridItem {
  fieldId: string
  x: number // start column 0–11
  y: number // row order
  w: number // column span 1–12
}

export interface Block {
  id: string
  title: string
  builtin?: boolean // built-in block — title is fixed, can't be deleted
  templateId?: string // library block this copy came from (for edit propagation)
  fields: FieldDef[]
  values: Record<string, FieldValue>
  // Per-image-field display options, keyed by field id.
  imageMeta?: Record<string, ImageMeta>
  // Optional 12-col layout for custom blocks. Absent = stacked.
  grid?: GridItem[]
}

export interface ResumeData {
  // Header is special: it always renders at the top, outside the block list.
  header: {
    fullName: string
    title: string
    photo: string
    photoSize?: number // rendered diameter in px (default 64)
    photoShape?: 'circle' | 'square'
    contacts: { id: string; type: string; value: string }[]
  }
  blocks: Block[]
  // Reusable block templates the user has created. Persisted with the resume so
  // they can re-insert a saved block via the "Add section" picker.
  blockLibrary?: Block[]
}

export type TemplateId = 'modern' | 'classic' | 'compact'

export interface ResumeSettings {
  template: TemplateId
  accent: string
  fontFamily: string
  fontScale: number
}

export interface ResumeDoc {
  data: ResumeData
  settings: ResumeSettings
  updatedAt?: number
  version?: number
}

export const SCHEMA_VERSION = 2

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Inter / System Sans', value: "system-ui, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Georgia (Serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Garamond (Serif)', value: "'EB Garamond', Garamond, serif" },
  { label: 'Courier (Mono)', value: "'Courier New', ui-monospace, monospace" },
]

export const ACCENT_PRESETS = ['#f0532f', '#2563eb', '#7c3aed', '#0d9488', '#ea580c', '#0f172a']

export const CONTACT_TYPES = ['email', 'phone', 'location', 'website', 'linkedin', 'github'] as const

let idCounter = 0
export const newId = (): string => {
  idCounter += 1
  // Counter guarantees uniqueness within a session; the random suffix avoids
  // collisions across reloads / multiple tabs writing to the same account.
  const rand = Math.random().toString(36).slice(2, 8)
  return `f${idCounter}-${rand}`
}

export const defaultSettings: ResumeSettings = {
  template: 'modern',
  accent: '#f0532f',
  fontFamily: FONT_OPTIONS[0].value,
  fontScale: 1,
}

// ---- Field helpers ----
export const f = {
  text: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'text', label, locked }),
  textarea: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'textarea', label, locked }),
  tags: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'tags', label, locked }),
  list: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'list', label, locked }),
  date: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'date', label, locked }),
  button: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'button', label, locked }),
  skillbar: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'skillbar', label, locked }),
  image: (label: string, locked = false): FieldDef => ({ id: newId(), type: 'image', label, locked }),
  repeater: (label: string, fields: FieldDef[], locked = false): FieldDef => ({
    id: newId(),
    type: 'repeater',
    label,
    locked,
    fields,
  }),
}

// Blank value for a freshly added field.
export function blankValue(field: FieldDef): FieldValue {
  switch (field.type) {
    case 'tags':
    case 'list':
    case 'skillbar':
    case 'repeater':
      return []
    default:
      return ''
  }
}

export function blankRow(fields: FieldDef[]): RepeaterRow {
  const row: RepeaterRow = { __id: newId() }
  for (const fd of fields) row[fd.id] = fd.type === 'tags' || fd.type === 'list' ? [] : ''
  return row
}

// ---- Default (sample) resume ----
export function buildSample(): ResumeData {
  const expRow = [f.text('Role', true), f.text('Company', true), f.text('Period', true), f.textarea('Highlights', true)]
  const eduRow = [f.text('Degree', true), f.text('School', true), f.text('Period', true), f.text('Details', true)]
  const projRow = [f.text('Name', true), f.text('Link', true), f.textarea('Description', true)]

  const summaryField = f.textarea('Summary', true)
  const skillsField = f.tags('Skills', true)
  const expField = f.repeater('Roles', expRow, true)
  const eduField = f.repeater('Entries', eduRow, true)
  const projField = f.repeater('Projects', projRow, true)

  const mk = (
    title: string,
    field: FieldDef,
    value: FieldValue,
  ): Block => ({ id: newId(), title, builtin: true, fields: [field], values: { [field.id]: value } })

  return {
    header: {
      fullName: 'John Doe',
      title: 'Senior Frontend Engineer',
      photo: '',
      contacts: [
        { id: newId(), type: 'email', value: 'john.doe@example.com' },
        { id: newId(), type: 'phone', value: '+1 (555) 123-4567' },
        { id: newId(), type: 'location', value: 'San Francisco, CA' },
        { id: newId(), type: 'website', value: 'johndoe.dev' },
        { id: newId(), type: 'linkedin', value: 'linkedin.com/in/johndoe' },
        { id: newId(), type: 'github', value: 'github.com/johndoe' },
      ],
    },
    blocks: [
      mk('Summary', summaryField, 'Frontend engineer with 7+ years building performant, accessible web apps.'),
      mk('Skills', skillsField, ['React', 'TypeScript', 'Next.js', 'Node.js', 'GraphQL', 'Testing']),
      mk('Experience', expField, [
        {
          __id: newId(),
          [expRow[0].id]: 'Senior Frontend Engineer',
          [expRow[1].id]: 'Acme Corp',
          [expRow[2].id]: 'Jan 2021 – Present',
          [expRow[3].id]:
            'Led migration to React + TypeScript, cutting load time 45%.\nBuilt a shared component library adopted by 6 teams.',
        },
      ]),
      mk('Projects', projField, [
        {
          __id: newId(),
          [projRow[0].id]: 'OpenChart',
          [projRow[1].id]: 'github.com/johndoe/openchart',
          [projRow[2].id]: 'Open-source charting library with 2k+ GitHub stars.',
        },
      ]),
      mk('Education', eduField, [
        {
          __id: newId(),
          [eduRow[0].id]: 'B.S. Computer Science',
          [eduRow[1].id]: 'UC Berkeley',
          [eduRow[2].id]: '2014 – 2018',
          [eduRow[3].id]: 'GPA 3.8 · Dean’s List',
        },
      ]),
    ],
  }
}

// Build a custom block from a title and a set of field definitions, initializing
// each field to its blank value. Used by the "Create block" modal.
export function blockFromFields(title: string, fields: FieldDef[]): Block {
  const values: Record<string, FieldValue> = {}
  for (const fd of fields) values[fd.id] = blankValue(fd)
  return { id: newId(), title: title.trim() || 'New section', builtin: false, fields, values }
}

function deepCopyFields(fields: FieldDef[]): FieldDef[] {
  // Keep field ids so edits to the template can map onto placed copies' values.
  return fields.map((f) => ({ ...f, fields: f.fields ? deepCopyFields(f.fields) : undefined }))
}

// Make a fresh copy of a library block to insert into the resume. Field ids are
// preserved (so template edits can re-sync values); only the block id is new.
// `templateId` records the source so edits can propagate to this copy.
export function cloneBlock(block: Block): Block {
  const fields = deepCopyFields(block.fields)
  const values: Record<string, FieldValue> = {}
  for (const fd of fields) values[fd.id] = blankValue(fd)
  return {
    id: newId(),
    templateId: block.id,
    title: block.title,
    builtin: false,
    fields,
    values,
    grid: block.grid ? block.grid.map((g) => ({ ...g })) : undefined,
  }
}

// Re-apply an edited template's structure/layout to a placed copy, preserving
// the user's entered values for fields that still exist.
export function resyncBlock(placed: Block, template: Block): Block {
  const fields = deepCopyFields(template.fields)
  const values: Record<string, FieldValue> = {}
  for (const fd of fields) {
    values[fd.id] = fd.id in placed.values ? placed.values[fd.id] : blankValue(fd)
  }
  return {
    ...placed,
    title: template.title,
    fields,
    values,
    grid: template.grid ? template.grid.map((g) => ({ ...g })) : undefined,
    imageMeta: placed.imageMeta,
  }
}
