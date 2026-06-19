// Portfolio (one-page website) model. Reuses the resume Block/FieldDef shapes so
// the same field editors work, plus site-level theme settings.
import {
  f,
  blankValue,
  newId,
  type Block,
  type FieldValue,
  type ResumeData,
} from '../types'

export interface FooterLink {
  id: string
  label: string
  url: string
}

// A "design" is a whole visual treatment: a CSS theme layered on the shared
// portfolio styles (typography scale, hero style, card/skill shapes, section
// rhythm). It's applied via data-design on the root and is independent of the
// page content — switching the design restyles whatever sections exist. The
// designs gallery also offers a matching content seed (see buildDesignSeed).
export type DesignId =
  | 'designer'
  | 'minimal'
  | 'studio'
  | 'bold'
  | 'editorial'
  | 'developer'
  | 'corporate'
  | 'academia'
  | 'gallery'

export interface PortfolioSettings {
  accent: string
  fontFamily: string
  siteTitle: string
  theme: 'light' | 'dark'
  design?: DesignId // visual treatment; defaults to 'designer' when unset
  pageBg?: string // custom page/body background; overrides the theme's --bg
  contactEmail: string // used by the footer "contact" link
  // Footer customization. When unset, the footer falls back to "© <year> <title>".
  footerText?: string // left side; supports {year} and {title} placeholders
  footerLinks?: FooterLink[] // right side links (social, etc.)
  footerShowEmail?: boolean // show the contact email as a link (default true)
}

// Catalogue of designs shown in the gallery. `accent`/`font`/`theme` are the
// look the seed ships with; the user can still override all of them after.
export interface DesignMeta {
  id: DesignId
  label: string
  blurb: string
  accent: string
  theme: 'light' | 'dark'
  fontFamily: string
}

export const DESIGNS: DesignMeta[] = [
  {
    id: 'designer',
    label: 'Designer',
    blurb: 'Bold uppercase hero with a ghost watermark, accent frames and an icon services grid. The original.',
    accent: '#f0532f',
    theme: 'dark',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: 'minimal',
    label: 'Minimal',
    blurb: 'Quiet and roomy. Light theme, restrained type, hairline rules — lets the work speak.',
    accent: '#111827',
    theme: 'light',
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'studio',
    label: 'Studio',
    blurb: 'Agency feel: a project-card grid, soft panels and confident headings.',
    accent: '#2563eb',
    theme: 'light',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: 'bold',
    label: 'Bold',
    blurb: 'Big type and an accent-filled hero. High contrast, made to be noticed.',
    accent: '#7c3aed',
    theme: 'dark',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: 'editorial',
    label: 'Editorial',
    blurb: 'Serif, magazine-style. Centered headings and generous line height for writing-heavy folios.',
    accent: '#b45309',
    theme: 'light',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    id: 'developer',
    label: 'Developer',
    blurb: 'Terminal-flavoured dark theme with mono accents — for engineers shipping projects.',
    accent: '#22d3ee',
    theme: 'dark',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: 'corporate',
    label: 'Corporate',
    blurb: 'Structured and trustworthy. Navy accents, a banded hero and a tidy services grid — for companies and consultancies.',
    accent: '#1d4ed8',
    theme: 'light',
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'academia',
    label: 'Academia',
    blurb: 'Formal university feel: serif headings, a crest-style hero rule and clean record lists — for schools, faculty and students.',
    accent: '#7f1d1d',
    theme: 'light',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    id: 'gallery',
    label: 'Gallery',
    blurb: 'Image-first and dramatic. Edge-to-edge work grid on a near-black canvas — for studios, photographers and artists.',
    accent: '#e11d48',
    theme: 'dark',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
]

export type BlockBg = 'none' | 'soft' | 'accent' | 'dark'
export type BlockPad = 'compact' | 'normal' | 'roomy'
export type BlockAlign = 'left' | 'center'

export interface BlockStyle {
  bg?: BlockBg
  pad?: BlockPad
  align?: BlockAlign
}

// Determines the exact rendered layout of a section. 'default' = generic block.
export type SectionKind =
  | 'default'
  | 'hero'
  | 'about'
  | 'skills'
  | 'available'
  | 'portfolio'
  | 'services'
  | 'contact'

export interface PortfolioData {
  settings: PortfolioSettings
  // New Elementor-style page-builder document. When present, the canvas builder
  // and the export render from this (the legacy `blocks` below are kept only for
  // backward-compatible migration of old saves).
  page?: import('./canvas/model').PageData
  blocks: Block[]
  // Per-block visual style, keyed by block id.
  styles?: Record<string, BlockStyle>
  // Per-block layout kind (how the section renders), keyed by block id.
  kinds?: Record<string, SectionKind>
  // Reusable web-block templates ("My web blocks").
  blockLibrary?: Block[]
  // Saved style for each library template, keyed by template id.
  libraryStyles?: Record<string, BlockStyle>
}

export interface PortfolioDoc {
  data: PortfolioData
  updatedAt?: number
}

export const PORTFOLIO_FONTS: { label: string; value: string }[] = [
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif" },
  { label: 'Inter / System', value: "system-ui, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Georgia (Serif)', value: "Georgia, 'Times New Roman', serif" },
]

export const defaultPortfolioSettings: PortfolioSettings = {
  accent: '#f0532f',
  fontFamily: PORTFOLIO_FONTS[0].value,
  siteTitle: 'My Portfolio',
  theme: 'dark',
  design: 'designer',
  contactEmail: '',
  footerText: '© {year} {title}',
  footerLinks: [],
  footerShowEmail: true,
}

// Build a starter portfolio, pre-filled from the user's resume data.
export function buildPortfolioFromResume(resume: ResumeData): PortfolioData {
  const h = resume.header
  const contactLines = h.contacts.map((c) => `${c.type}: ${c.value}`).join('\n')

  const block = (title: string, fields: Parameters<typeof mk>[1], values: Record<string, FieldValue>): Block =>
    mk(title, fields, values)

  const email = h.contacts.find((c) => c.type === 'email')?.value ?? ''

  // Hero (centered, with a contact button)
  const heroName = f.text('Name')
  const heroTitle = f.text('Tagline')
  const heroPhoto = f.image('Photo')
  const heroBtn = f.button('Button')
  const hero = block('Hero', [heroName, heroTitle, heroPhoto, heroBtn], {
    [heroName.id]: h.fullName,
    [heroTitle.id]: h.title,
    [heroPhoto.id]: h.photo,
    [heroBtn.id]: `Get in touch|mailto:${email}`,
  })

  // About (from summary block if present)
  const summaryText = firstTextValue(resume, /summary/i)
  const aboutBody = f.textarea('About me')
  const about = block('About', [aboutBody], { [aboutBody.id]: summaryText })

  // Skills → skill bars (default 90% each).
  const skills = firstTagsValue(resume, /skill/i)
  const skillsField = f.skillbar('Skills')
  const skillsBlock = block('Skills', [skillsField], {
    [skillsField.id]: skills.map((s) => `${s} 90`),
  })

  // Contact (intro text + email button)
  const contactText = f.textarea('Message')
  const contactBtn = f.button('Email')
  const contact = block('Contact', [contactText, contactBtn], {
    [contactText.id]: contactLines,
    [contactBtn.id]: `Email me|mailto:${email}`,
  })

  return {
    settings: {
      ...defaultPortfolioSettings,
      siteTitle: `${h.fullName || 'My'} — Portfolio`,
      contactEmail: email,
    },
    blocks: [hero, about, skillsBlock, contact],
    styles: {
      [hero.id]: { bg: 'soft', pad: 'roomy', align: 'center' },
      [contact.id]: { bg: 'dark', pad: 'roomy', align: 'center' },
    },
  }
}

// Ready-made section templates the user can insert with one click.
export type TemplateKey = 'hero' | 'about' | 'skills' | 'projects' | 'experience' | 'contact'

export function makeTemplate(key: TemplateKey): { block: Block; style?: BlockStyle } {
  switch (key) {
    case 'hero': {
      const name = f.text('Name')
      const tag = f.text('Tagline')
      const photo = f.image('Photo')
      const btn = f.button('Button')
      return {
        block: mk('Hero', [name, tag, photo, btn], {
          [name.id]: 'Your Name',
          [tag.id]: 'What you do',
          [photo.id]: '',
          [btn.id]: 'Get in touch|#contact',
        }),
        style: { bg: 'soft', pad: 'roomy', align: 'center' },
      }
    }
    case 'about': {
      const body = f.textarea('About me')
      return { block: mk('About', [body], { [body.id]: '' }) }
    }
    case 'skills': {
      const bars = f.skillbar('Skills')
      return {
        block: mk('Skills', [bars], { [bars.id]: ['Design 90', 'Development 85'] }),
      }
    }
    case 'projects': {
      const rep = f.repeater('Projects', [f.text('Name'), f.textarea('Description'), f.button('Link')])
      return { block: mk('Projects', [rep], { [rep.id]: [] }) }
    }
    case 'experience': {
      const rep = f.repeater('Experience', [
        f.text('Role'),
        f.text('Company'),
        f.date('Period'),
        f.textarea('Details'),
      ])
      return { block: mk('Experience', [rep], { [rep.id]: [] }) }
    }
    case 'contact': {
      const text = f.textarea('Message')
      const btn = f.button('Email')
      return {
        block: mk('Contact', [text, btn], { [text.id]: '', [btn.id]: 'Email me|mailto:' }),
        style: { bg: 'dark', pad: 'roomy', align: 'center' },
      }
    }
  }
}

function mk(title: string, fields: Block['fields'], values: Record<string, FieldValue>): Block {
  return { id: newId(), title, builtin: false, fields, values }
}

// Find the first textarea/text value in a block whose title matches a pattern.
function firstTextValue(resume: ResumeData, re: RegExp): string {
  for (const b of resume.blocks) {
    if (!re.test(b.title)) continue
    for (const fd of b.fields) {
      const v = b.values[fd.id]
      if (typeof v === 'string' && v.trim()) return v
    }
  }
  return ''
}

function firstTagsValue(resume: ResumeData, re: RegExp): string[] {
  for (const b of resume.blocks) {
    if (!re.test(b.title)) continue
    for (const fd of b.fields) {
      const v = b.values[fd.id]
      if (Array.isArray(v) && v.length) return v as string[]
    }
  }
  return []
}

export function newWebBlock(title = 'New section'): Block {
  const field = f.text('Heading')
  return { id: newId(), title, builtin: false, fields: [field], values: { [field.id]: blankValue(field) } }
}

// Build a web block from a title + fields, initializing each field's value.
export function webBlockFromFields(title: string, fields: Block['fields']): Block {
  const values: Record<string, FieldValue> = {}
  for (const fd of fields) values[fd.id] = blankValue(fd)
  return { id: newId(), title: title.trim() || 'New section', builtin: false, fields, values }
}

// Fresh copy of a library web block to insert into the portfolio. Field ids are
// kept (so template edits can re-sync) but the block id and templateId are set.
export function cloneWebBlock(tpl: Block): Block {
  const values: Record<string, FieldValue> = {}
  for (const fd of tpl.fields) values[fd.id] = blankValue(fd)
  return {
    id: newId(),
    templateId: tpl.id,
    title: tpl.title,
    builtin: false,
    fields: tpl.fields.map((f) => ({ ...f, fields: f.fields ? [...f.fields] : undefined })),
    values,
    grid: tpl.grid ? tpl.grid.map((g) => ({ ...g })) : undefined,
  }
}

// One-click "Designer" template — reproduces the reference layout exactly.
// Pre-fills from resume where possible; each block gets a SectionKind.
export function buildDesignerPortfolio(resume: ResumeData): PortfolioData {
  const h = resume.header
  const email = h.contacts.find((c) => c.type === 'email')?.value ?? ''
  const phone = h.contacts.find((c) => c.type === 'phone')?.value ?? ''
  const location = h.contacts.find((c) => c.type === 'location')?.value ?? ''
  const summary = firstTextValue(resume, /summary|about/i)
  const skills = firstTagsValue(resume, /skill/i)

  const kinds: Record<string, SectionKind> = {}
  const make = (title: string, kind: SectionKind, fields: Block['fields'], values: Record<string, FieldValue>): Block => {
    const b: Block = { id: newId(), title, builtin: false, fields, values }
    kinds[b.id] = kind
    return b
  }

  // Hero
  const hEyebrow = f.text('Eyebrow')
  const hName = f.text('Title')
  const hBtn = f.button('Button')
  const hero = make('Home', 'hero', [hEyebrow, hName, hBtn], {
    [hEyebrow.id]: "I'm a",
    [hName.id]: (h.title || 'Graphic Designer').toUpperCase(),
    [hBtn.id]: `Contact me|#contact`,
  })

  // About — photo + name + info + education
  const aPhoto = f.image('Photo')
  const aName = f.text('Name')
  const aBody = f.textarea('Bio')
  const aInfo = f.list('Info')
  const aEdu = f.textarea('Education')
  const about = make('About Me', 'about', [aPhoto, aName, aBody, aInfo, aEdu], {
    [aPhoto.id]: h.photo,
    [aName.id]: h.fullName || 'Your Name',
    [aBody.id]: summary || 'A short introduction about you, your experience and what you do best.',
    [aInfo.id]: [
      `Name: ${h.fullName}`,
      `Phone: ${phone}`,
      `Location: ${location}`,
      `Email: ${email}`,
    ].filter((l) => l.split(': ')[1]),
    [aEdu.id]: '',
  })

  // Skills
  const sBars = f.skillbar('Skills')
  const skillsBlock = make('Skills', 'skills', [sBars], {
    [sBars.id]: (skills.length ? skills : ['Design', 'Development', 'Branding', 'Strategy']).map(
      (s) => `${s} 90`,
    ),
  })

  // Available band
  const avText = f.text('Statement')
  const available = make('Available', 'available', [avText], {
    [avText.id]: 'I Am Available For Freelance !',
  })

  // Portfolio — image grid
  const pItems = f.repeater('Items', [f.image('Image'), f.text('Title'), f.button('Link')])
  const portfolio = make('Portfolio', 'portfolio', [pItems], { [pItems.id]: [] })

  // Services — icon grid (icon = emoji/char text, title, blurb)
  const svcItems = f.repeater('Items', [f.text('Title'), f.textarea('Description')])
  const services = make('Services', 'services', [svcItems], {
    [svcItems.id]: [
      'Graphic Design',
      'Web Design',
      'Branding',
      'Motion Graphic',
      'Video Editing',
      '3D Modeling',
    ].map((t) => ({
      __id: newId(),
      [svcItems.fields![0].id]: t,
      [svcItems.fields![1].id]: 'A short description of this service.',
    })) as FieldValue,
  })

  // Contact — accent band, 3 columns + send button
  const cPhone = f.text('Phone')
  const cEmail = f.text('Email')
  const cAddr = f.text('Address')
  const cBtn = f.button('Button')
  const contact = make('Contact', 'contact', [cPhone, cEmail, cAddr, cBtn], {
    [cPhone.id]: phone,
    [cEmail.id]: email,
    [cAddr.id]: location,
    [cBtn.id]: `Send message|mailto:${email}`,
  })

  return {
    settings: {
      ...defaultPortfolioSettings,
      theme: 'dark',
      siteTitle: h.fullName || 'Portfolio',
      contactEmail: email,
    },
    blocks: [hero, about, skillsBlock, available, portfolio, services, contact],
    kinds,
    styles: {},
  }
}
