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

export type TemplateId = 'modern' | 'classic' | 'compact' | 'sidebar' | 'minimal' | 'elegant'

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
      fullName: 'Maya Fernandez',
      title: 'Frontend Engineer',
      photo: '',
      contacts: [
        { id: newId(), type: 'email', value: 'maya.fernandez@gmail.com' },
        { id: newId(), type: 'phone', value: '+1 (415) 802-7741' },
        { id: newId(), type: 'location', value: 'Oakland, CA' },
        { id: newId(), type: 'website', value: 'mayafernandez.dev' },
        { id: newId(), type: 'linkedin', value: 'linkedin.com/in/mayafdz' },
        { id: newId(), type: 'github', value: 'github.com/mayafdz' },
      ],
    },
    blocks: [
      mk(
        'Summary',
        summaryField,
        'Frontend engineer who likes turning messy interfaces into ones people actually enjoy using. ' +
          "Spent the last several years on design systems and the unglamorous accessibility work that makes them hold up. Happiest pairing with designers and shipping in small steps.",
      ),
      mk('Skills', skillsField, ['React', 'TypeScript', 'Next.js', 'CSS', 'Node.js', 'Accessibility', 'Playwright']),
      mk('Experience', expField, [
        {
          __id: newId(),
          [expRow[0].id]: 'Frontend Engineer',
          [expRow[1].id]: 'Ledgerline',
          [expRow[2].id]: 'Mar 2021 – Present',
          [expRow[3].id]:
            'Rebuilt the billing dashboard the team had been afraid to touch — it’s now the part of the app support gets the fewest tickets about.\n' +
            'Took over our component library and got the other teams to actually adopt it by sitting with them, not by writing a mandate.\n' +
            'Wrote the accessibility tests nobody wanted to, which quietly caught a few embarrassing bugs before customers did.',
        },
        {
          __id: newId(),
          [expRow[0].id]: 'Junior Web Developer',
          [expRow[1].id]: 'Brightwell Studio',
          [expRow[2].id]: '2018 – 2021',
          [expRow[3].id]:
            'Built marketing sites for clients ranging from a local bakery to a mid-size bank — learned to ask “why” before “how.”\n' +
            'Was the person who finally documented our deploy process so new hires stopped pinging me at 9pm.',
        },
      ]),
      mk('Projects', projField, [
        {
          __id: newId(),
          [projRow[0].id]: 'Tidepool',
          [projRow[1].id]: 'github.com/mayafdz/tidepool',
          [projRow[2].id]:
            'A little tide-chart app for surfers I made for my brother. People I’ve never met use it now, which is a strange and nice feeling.',
        },
      ]),
      mk('Education', eduField, [
        {
          __id: newId(),
          [eduRow[0].id]: 'B.A. Cognitive Science',
          [eduRow[1].id]: 'UC Santa Cruz',
          [eduRow[2].id]: '2014 – 2018',
          [eduRow[3].id]: 'Minor in Computer Science. Spent more time in the HCI lab than I should admit.',
        },
      ]),
    ],
  }
}

// ---- Role-based starter presets ----
// Each preset is a hand-written starter resume aimed at a kind of role. They
// share buildSample's block shapes (Summary / Skills / Experience / Projects /
// Education) so the editor treats them identically — only the content, ordering
// and suggested visual settings differ. The voice is deliberately first-person
// and a little informal so a freshly-started resume doesn't read as boilerplate.

export interface ResumePreset {
  id: string
  label: string
  blurb: string
  settings: Partial<ResumeSettings>
  build: () => ResumeData
}

// Spec for one starter, expanded into real blocks by buildPreset.
interface PresetSpec {
  fullName: string
  title: string
  contacts: { type: string; value: string }[]
  summary: string
  skills: string[]
  experience: { role: string; company: string; period: string; highlights: string }[]
  projects?: { name: string; link: string; description: string }[]
  education: { degree: string; school: string; period: string; details: string }[]
}

function buildPreset(spec: PresetSpec): ResumeData {
  const expRow = [f.text('Role', true), f.text('Company', true), f.text('Period', true), f.textarea('Highlights', true)]
  const eduRow = [f.text('Degree', true), f.text('School', true), f.text('Period', true), f.text('Details', true)]
  const projRow = [f.text('Name', true), f.text('Link', true), f.textarea('Description', true)]

  const summaryField = f.textarea('Summary', true)
  const skillsField = f.tags('Skills', true)
  const expField = f.repeater('Roles', expRow, true)
  const eduField = f.repeater('Entries', eduRow, true)
  const projField = f.repeater('Projects', projRow, true)

  const mk = (title: string, field: FieldDef, value: FieldValue): Block => ({
    id: newId(),
    title,
    builtin: true,
    fields: [field],
    values: { [field.id]: value },
  })

  const blocks: Block[] = [
    mk('Summary', summaryField, spec.summary),
    mk('Skills', skillsField, spec.skills),
    mk(
      'Experience',
      expField,
      spec.experience.map((e) => ({
        __id: newId(),
        [expRow[0].id]: e.role,
        [expRow[1].id]: e.company,
        [expRow[2].id]: e.period,
        [expRow[3].id]: e.highlights,
      })),
    ),
  ]

  if (spec.projects?.length) {
    blocks.push(
      mk(
        'Projects',
        projField,
        spec.projects.map((p) => ({
          __id: newId(),
          [projRow[0].id]: p.name,
          [projRow[1].id]: p.link,
          [projRow[2].id]: p.description,
        })),
      ),
    )
  }

  blocks.push(
    mk(
      'Education',
      eduField,
      spec.education.map((e) => ({
        __id: newId(),
        [eduRow[0].id]: e.degree,
        [eduRow[1].id]: e.school,
        [eduRow[2].id]: e.period,
        [eduRow[3].id]: e.details,
      })),
    ),
  )

  return {
    header: {
      fullName: spec.fullName,
      title: spec.title,
      photo: '',
      contacts: spec.contacts.map((c) => ({ id: newId(), type: c.type, value: c.value })),
    },
    blocks,
  }
}

export const RESUME_PRESETS: ResumePreset[] = [
  {
    id: 'sample',
    label: 'Sample',
    blurb: 'The default starter — a realistic frontend engineer to edit over.',
    settings: { template: 'modern', accent: '#f0532f' },
    build: buildSample,
  },
  {
    id: 'one-page-tech',
    label: 'One-page tech',
    blurb: 'Tight, single-page layout for engineers who want everything to fit.',
    settings: { template: 'compact', accent: '#2563eb', fontScale: 0.95 },
    build: () =>
      buildPreset({
        fullName: 'Devin Park',
        title: 'Backend Engineer',
        contacts: [
          { type: 'email', value: 'devin.park@gmail.com' },
          { type: 'phone', value: '+1 (206) 555-0182' },
          { type: 'location', value: 'Seattle, WA' },
          { type: 'github', value: 'github.com/devpark' },
        ],
        summary:
          "Backend engineer who cares more about systems that stay up at 3am than ones that demo well. I like boring, predictable infrastructure and writing the runbook before I need it.",
        skills: ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes', 'gRPC', 'Terraform'],
        experience: [
          {
            role: 'Backend Engineer',
            company: 'Northgate Logistics',
            period: '2020 – Present',
            highlights:
              'Owned the order-routing service from the messy version to the one we stopped getting paged about.\n' +
              'Moved us off a single database before it became a Friday-night problem, and documented why so it stays that way.',
          },
          {
            role: 'Software Engineer',
            company: 'Tessellate',
            period: '2017 – 2020',
            highlights:
              'Built internal tools nobody asked for but everyone ended up using.\n' +
              'Was the person who actually read the Postgres docs when queries got slow.',
          },
        ],
        education: [
          {
            degree: 'B.S. Computer Engineering',
            school: 'University of Washington',
            period: '2013 – 2017',
            details: 'Paid my way through running the campus Linux club’s server.',
          },
        ],
      }),
  },
  {
    id: 'creative',
    label: 'Creative',
    blurb: 'Warmer, design-forward look for designers and creative roles.',
    settings: { template: 'sidebar', accent: '#7c3aed', fontFamily: FONT_OPTIONS[2].value },
    build: () =>
      buildPreset({
        fullName: 'Noor Haddad',
        title: 'Product Designer',
        contacts: [
          { type: 'email', value: 'noor@noorhaddad.design' },
          { type: 'location', value: 'Brooklyn, NY' },
          { type: 'website', value: 'noorhaddad.design' },
          { type: 'linkedin', value: 'linkedin.com/in/noorhaddad' },
        ],
        summary:
          'Product designer who started in illustration and never quite let go of it. I sketch before I open Figma, and I think the best work happens when designers and engineers argue early and often.',
        skills: ['Figma', 'Prototyping', 'Design systems', 'User research', 'Illustration', 'Motion'],
        experience: [
          {
            role: 'Product Designer',
            company: 'Marigold',
            period: '2021 – Present',
            highlights:
              'Redesigned onboarding by actually watching people get stuck in it, not by guessing.\n' +
              'Built and maintained the design system, mostly by making it the path of least resistance.',
          },
          {
            role: 'Visual Designer',
            company: 'Studio Kettle',
            period: '2018 – 2021',
            highlights:
              'Brand and web work for small clients who trusted us with a lot.\n' +
              'Learned that a good question saves more time than a good mockup.',
          },
        ],
        projects: [
          {
            name: 'Slowtype',
            link: 'slowtype.studio',
            description: 'A small type-specimen zine I write and design on weekends. Print, on purpose.',
          },
        ],
        education: [
          {
            degree: 'BFA Graphic Design',
            school: 'RISD',
            period: '2014 – 2018',
            details: 'Thesis on wayfinding in transit systems.',
          },
        ],
      }),
  },
  {
    id: 'academic',
    label: 'Academic CV',
    blurb: 'Serif, formal layout suited to research and academic roles.',
    settings: { template: 'elegant', accent: '#0f172a', fontFamily: FONT_OPTIONS[1].value },
    build: () =>
      buildPreset({
        fullName: 'Dr. Elena Vasquez',
        title: 'Postdoctoral Researcher, Marine Biology',
        contacts: [
          { type: 'email', value: 'e.vasquez@university.edu' },
          { type: 'location', value: 'Woods Hole, MA' },
          { type: 'website', value: 'elenavasquez.science' },
        ],
        summary:
          'Marine biologist studying how coral microbiomes shift under heat stress. My fieldwork takes me from the lab bench to reef sites I’m increasingly worried about, which is rather the point.',
        skills: ['Microbial ecology', 'Bioinformatics', 'R', 'Field sampling', 'Grant writing', 'Teaching'],
        experience: [
          {
            role: 'Postdoctoral Researcher',
            company: 'Woods Hole Oceanographic Institution',
            period: '2022 – Present',
            highlights:
              'Lead a long-term study tracking coral-associated bacteria across three reef systems.\n' +
              'Mentor two graduate students, which has taught me more about my own work than I expected.',
          },
          {
            role: 'Graduate Researcher',
            company: 'Scripps Institution of Oceanography',
            period: '2017 – 2022',
            highlights:
              'Dissertation on thermal tolerance in reef-building corals.\n' +
              'Ran three field seasons in the Coral Triangle, mostly held together by good colleagues.',
          },
        ],
        education: [
          {
            degree: 'Ph.D. Marine Biology',
            school: 'UC San Diego',
            period: '2017 – 2022',
            details: 'Dissertation: Microbial resilience in warming reef systems.',
          },
          {
            degree: 'B.S. Biology',
            school: 'University of Miami',
            period: '2013 – 2017',
            details: 'Graduated with honors; first generation to finish college.',
          },
        ],
      }),
  },
  {
    id: 'executive',
    label: 'Executive',
    blurb: 'Clean, confident layout for senior and leadership roles.',
    settings: { template: 'minimal', accent: '#0f172a' },
    build: () =>
      buildPreset({
        fullName: 'James Okonkwo',
        title: 'VP of Engineering',
        contacts: [
          { type: 'email', value: 'james.okonkwo@gmail.com' },
          { type: 'phone', value: '+1 (312) 555-0147' },
          { type: 'location', value: 'Chicago, IL' },
          { type: 'linkedin', value: 'linkedin.com/in/jamesokonkwo' },
        ],
        summary:
          'Engineering leader who came up through the codebase, not around it. I’ve grown two teams from a handful of people to a few dozen, and I’ve learned that culture is mostly the decisions you make when it’s inconvenient.',
        skills: ['Team building', 'Platform strategy', 'Hiring', 'Mentorship', 'Incident response', 'Budgeting'],
        experience: [
          {
            role: 'VP of Engineering',
            company: 'Cleargrove',
            period: '2019 – Present',
            highlights:
              'Grew the org from 12 to 40 engineers without losing the things that made the first 12 want to stay.\n' +
              'Rebuilt how we handle incidents so the focus landed on the system, not the person who pushed the button.',
          },
          {
            role: 'Director of Engineering',
            company: 'Halcyon Health',
            period: '2014 – 2019',
            highlights:
              'Led the platform team through a migration that everyone said would take a year and quietly took fourteen months.\n' +
              'Made hiring a craft on the team, not a chore handed to whoever was free.',
          },
        ],
        education: [
          {
            degree: 'B.S. Computer Science',
            school: 'University of Illinois',
            period: '2006 – 2010',
            details: '',
          },
        ],
      }),
  },
]

// A single "Default block" offered in the "Add section" picker out of the box,
// so a user can add a ready-made section (bold title · title · date +
// description) without building one from scratch. Labels are generic and
// unlocked so the block can be renamed and repurposed for any content.
export function defaultBlockLibrary(): Block[] {
  const row = [f.text('Bold Title'), f.text('Title'), f.text('Date'), f.textarea('Description')]
  const field = f.repeater('Entries', row)
  return [
    {
      id: newId(),
      title: 'Default block',
      builtin: false,
      fields: [field],
      values: { [field.id]: blankValue(field) },
    },
  ]
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
