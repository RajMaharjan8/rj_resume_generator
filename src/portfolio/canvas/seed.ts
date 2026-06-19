// Builds the reference "Designer" layout as a PageData (sections → rows →
// columns → widgets), pre-filled from the user's resume.
import { newId, type ResumeData } from '../../types'
import {
  newColumn,
  newWidget,
  type Column,
  type PageData,
  type Section,
} from './model'

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

// Build a section with a single row from a list of columns.
function sec(name: string, columns: Column[], extra: Partial<Section> = {}): Section {
  return {
    id: newId(),
    name,
    rows: [{ id: newId(), columns }],
    bg: 'none',
    pad: 'normal',
    ...extra,
  }
}

export function buildDesignerPage(resume: ResumeData): PageData {
  const h = resume.header
  const email = h.contacts.find((c) => c.type === 'email')?.value ?? ''
  const phone = h.contacts.find((c) => c.type === 'phone')?.value ?? ''
  const location = h.contacts.find((c) => c.type === 'location')?.value ?? ''
  const summary = firstTextValue(resume, /summary|about/i)
  const skills = firstTagsValue(resume, /skill/i)

  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('text', { html: `<p>I'm a</p>` }),
        newWidget('heading', { text: (h.title || 'Graphic Designer').toUpperCase(), level: 1 }),
        newWidget('button', { text: 'Contact me', url: '#contact', align: 'left' }),
      ]),
    ],
    { pad: 'roomy', full: true },
  )

  const about = sec(
    'About',
    [
      newColumn(4, [newWidget('image', { src: h.photo, alt: h.fullName, shape: 'rounded' })]),
      newColumn(8, [
        newWidget('heading', { text: 'About Me', level: 2 }),
        newWidget('heading', { text: h.fullName || 'Your Name', level: 3 }),
        newWidget('text', {
          html: `<p>${summary || 'A short introduction about you, your experience and what you do best.'}</p>`,
        }),
        newWidget('text', {
          html: `<p><strong>Phone:</strong> ${phone || '—'}<br><strong>Email:</strong> ${
            email || '—'
          }<br><strong>Location:</strong> ${location || '—'}</p>`,
        }),
      ]),
    ],
    { pad: 'roomy' },
  )

  const skillList = (skills.length ? skills : ['Design', 'Development', 'Branding', 'Strategy']).map(
    (label) => ({ id: newId(), label, pct: 90 }),
  )
  const skillsSec = sec(
    'Skills',
    [
      newColumn(12, [
        newWidget('heading', { text: 'My Skills', level: 2 }),
        newWidget('skillbar', { skills: skillList }),
      ]),
    ],
    { bg: 'soft', pad: 'roomy' },
  )

  const available = sec(
    'Available',
    [newColumn(12, [newWidget('heading', { text: 'I Am Available For Freelance !', level: 2, align: 'center' })])],
    { bg: 'accent', pad: 'normal', full: true },
  )

  const portfolio = sec(
    'Portfolio',
    [
      newColumn(12, [
        newWidget('heading', { text: 'My Portfolio', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )

  const services = sec(
    'Services',
    [
      newColumn(12, [
        newWidget('heading', { text: 'My Services', level: 2 }),
        newWidget('services', {
          services: [
            { id: newId(), icon: 'G', title: 'Graphic Design', desc: 'A short description.' },
            { id: newId(), icon: 'W', title: 'Web Design', desc: 'A short description.' },
            { id: newId(), icon: 'B', title: 'Branding', desc: 'A short description.' },
            { id: newId(), icon: 'M', title: 'Motion Graphic', desc: 'A short description.' },
            { id: newId(), icon: 'V', title: 'Video Editing', desc: 'A short description.' },
            { id: newId(), icon: '3', title: '3D Modeling', desc: 'A short description.' },
          ],
        }),
      ]),
    ],
    { bg: 'soft', pad: 'roomy' },
  )

  const contact = sec(
    'Contact',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Get In Touch', level: 2, align: 'center' }),
        newWidget('contact', {
          cols: [
            { id: newId(), label: 'Call us on', value: phone },
            { id: newId(), label: 'Email us at', value: email },
            { id: newId(), label: 'Visit office', value: location },
          ],
          text: 'Send message',
          url: email ? `mailto:${email}` : '#',
        }),
      ]),
    ],
    { bg: 'dark', pad: 'roomy', full: true },
  )

  return { sections: [hero, about, skillsSec, available, portfolio, services, contact] }
}

// ---------------------------------------------------------------------------
// Design seeds. Each design ships a starter page with its own section structure
// and copy, pre-filled from the resume where possible. The visual treatment is
// applied separately (data-design + designCss); these only shape the content.
// ---------------------------------------------------------------------------

import type { DesignId } from '../types'

interface ResumeBits {
  name: string
  title: string
  photo: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
}

function resumeBits(resume: ResumeData): ResumeBits {
  const h = resume.header
  return {
    name: h.fullName || 'Your Name',
    title: h.title || 'Your Title',
    photo: h.photo,
    email: h.contacts.find((c) => c.type === 'email')?.value ?? '',
    phone: h.contacts.find((c) => c.type === 'phone')?.value ?? '',
    location: h.contacts.find((c) => c.type === 'location')?.value ?? '',
    summary: firstTextValue(resume, /summary|about/i),
    skills: firstTagsValue(resume, /skill/i),
  }
}

const mailto = (email: string) => (email ? `mailto:${email}` : '#contact')

function contactSection(b: ResumeBits, extra: Partial<Section> = {}): Section {
  return sec(
    'Contact',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Get In Touch', level: 2, align: 'center' }),
        newWidget('contact', {
          cols: [
            { id: newId(), label: 'Call', value: b.phone },
            { id: newId(), label: 'Email', value: b.email },
            { id: newId(), label: 'Location', value: b.location },
          ],
          text: 'Send message',
          url: mailto(b.email),
        }),
      ]),
    ],
    { bg: 'dark', pad: 'roomy', full: true, ...extra },
  )
}

function skillItems(b: ResumeBits, fallback: string[]) {
  return (b.skills.length ? b.skills : fallback).map((label) => ({ id: newId(), label, pct: 90 }))
}

// Minimal: a calm single-column folio — intro, a short about, skills, contact.
function minimalSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('heading', { text: b.name, level: 1 }),
        newWidget('text', { html: `<p>${b.title}${b.summary ? ` — ${b.summary}` : ''}</p>` }),
        newWidget('button', { text: 'Get in touch', url: mailto(b.email) }),
      ]),
    ],
    { pad: 'roomy' },
  )
  const work = sec(
    'Work',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Selected work', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )
  const skills = sec(
    'Skills',
    [
      newColumn(12, [
        newWidget('heading', { text: 'What I do', level: 2 }),
        newWidget('skillbar', { skills: skillItems(b, ['Design', 'Strategy', 'Research']) }),
      ]),
    ],
    { pad: 'normal' },
  )
  return { sections: [hero, work, skills, contactSection(b, { bg: 'none' })] }
}

// Studio: an agency-style page led by a project-card grid.
function studioSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(7, [
        newWidget('text', { html: `<p>${b.title}</p>` }),
        newWidget('heading', { text: b.name, level: 1 }),
        newWidget('text', {
          html: `<p>${b.summary || 'A studio of one. I help teams ship work they’re proud of.'}</p>`,
        }),
        newWidget('button', { text: 'Start a project', url: mailto(b.email) }),
      ]),
      newColumn(5, [newWidget('image', { src: b.photo, alt: b.name, shape: 'rounded' })]),
    ],
    { bg: 'soft', pad: 'roomy' },
  )
  const projects = sec(
    'Projects',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Recent projects', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )
  const services = sec(
    'Services',
    [
      newColumn(12, [
        newWidget('heading', { text: 'How I can help', level: 2 }),
        newWidget('services', {
          services: [
            { id: newId(), icon: 'S', title: 'Strategy', desc: 'Figuring out what to build and why.' },
            { id: newId(), icon: 'D', title: 'Design', desc: 'Interfaces people understand at a glance.' },
            { id: newId(), icon: 'B', title: 'Build', desc: 'Shipping it, then making it better.' },
          ],
        }),
      ]),
    ],
    { bg: 'soft', pad: 'roomy' },
  )
  return { sections: [hero, projects, services, contactSection(b)] }
}

// Bold: oversized hero, a strong statement band, then work + contact.
function boldSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('heading', { text: b.name.toUpperCase(), level: 1 }),
        newWidget('text', { html: `<p>${b.title}</p>` }),
        newWidget('button', { text: 'Let’s talk', url: mailto(b.email) }),
      ]),
    ],
    { pad: 'roomy', full: true },
  )
  const statement = sec(
    'Statement',
    [newColumn(12, [newWidget('heading', { text: b.summary || 'I make things that get noticed.', level: 2, align: 'center' })])],
    { bg: 'accent', pad: 'roomy', full: true, hideInNav: true },
  )
  const work = sec(
    'Work',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Work', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )
  return { sections: [hero, statement, work, contactSection(b)] }
}

// Editorial: serif, centered, writing-forward — about leads, then writing/work.
function editorialSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('image', { src: b.photo, alt: b.name, shape: 'circle', width: 30, align: 'center' }),
        newWidget('heading', { text: b.name, level: 1, align: 'center' }),
        newWidget('text', { html: `<p>${b.title}</p>` }),
      ]),
    ],
    { pad: 'roomy' },
  )
  const about = sec(
    'About',
    [
      newColumn(8, [
        newWidget('heading', { text: 'About', level: 2 }),
        newWidget('text', {
          html: `<p>${b.summary || 'A few words about who you are, written the way you’d actually say them.'}</p>`,
        }),
      ]),
    ],
    { pad: 'roomy', bg: 'soft' },
  )
  const writing = sec(
    'Writing',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Writing', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )
  return { sections: [hero, about, writing, contactSection(b, { bg: 'none' })] }
}

// Developer: terminal-flavoured. Intro, tech stack as skill bars, projects, contact.
function developerSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('text', { html: `<p>$ whoami</p>` }),
        newWidget('heading', { text: b.name, level: 1 }),
        newWidget('text', { html: `<p>${b.title}${b.summary ? ` · ${b.summary}` : ''}</p>` }),
        newWidget('button', { text: 'Get in touch', url: mailto(b.email) }),
      ]),
    ],
    { pad: 'roomy', full: true },
  )
  const stack = sec(
    'Stack',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Stack', level: 2 }),
        newWidget('skillbar', {
          skills: skillItems(b, ['TypeScript', 'React', 'Node.js', 'Postgres', 'Docker']),
        }),
      ]),
    ],
    { bg: 'soft', pad: 'roomy' },
  )
  const projects = sec(
    'Projects',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Projects', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )
  return { sections: [hero, stack, projects, contactSection(b)] }
}

// Corporate: a company/consultancy page — banded intro, about, services, contact.
function corporateSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(8, [
        newWidget('text', { html: `<p>${b.title}</p>` }),
        newWidget('heading', { text: b.name, level: 1 }),
        newWidget('text', {
          html: `<p>${b.summary || 'We help organisations do their best work — clearly, reliably, and on time.'}</p>`,
        }),
        newWidget('button', { text: 'Work with us', url: mailto(b.email) }),
      ]),
    ],
    { pad: 'roomy', full: true },
  )
  const services = sec(
    'Services',
    [
      newColumn(12, [
        newWidget('heading', { text: 'What we offer', level: 2 }),
        newWidget('services', {
          services: [
            { id: newId(), icon: 'C', title: 'Consulting', desc: 'Clear advice grounded in real experience.' },
            { id: newId(), icon: 'D', title: 'Delivery', desc: 'Shipping work that holds up in production.' },
            { id: newId(), icon: 'S', title: 'Support', desc: 'Sticking around after launch.' },
          ],
        }),
      ]),
    ],
    { bg: 'soft', pad: 'roomy' },
  )
  const about = sec(
    'About',
    [
      newColumn(5, [newWidget('image', { src: b.photo, alt: b.name, shape: 'rounded' })]),
      newColumn(7, [
        newWidget('heading', { text: 'About', level: 2 }),
        newWidget('text', { html: `<p>${b.summary || 'A short, confident summary of who you are and what you stand for.'}</p>` }),
        newWidget('skillbar', { skills: skillItems(b, ['Strategy', 'Operations', 'Delivery']) }),
      ]),
    ],
    { pad: 'roomy' },
  )
  return { sections: [hero, services, about, contactSection(b)] }
}

// Academia: a faculty/student page — formal intro, research/about, record list.
function academiaSeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('text', { html: `<p>${b.title}</p>` }),
        newWidget('heading', { text: b.name, level: 1, align: 'center' }),
        newWidget('text', { html: `<p>${b.location || 'Department · Institution'}</p>` }),
      ]),
    ],
    { pad: 'roomy' },
  )
  const about = sec(
    'Research',
    [
      newColumn(9, [
        newWidget('heading', { text: 'Research', level: 2 }),
        newWidget('text', {
          html: `<p>${b.summary || 'A description of your research interests, focus areas and current questions.'}</p>`,
        }),
      ]),
    ],
    { pad: 'roomy', bg: 'soft' },
  )
  const work = sec(
    'Publications',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Selected publications', level: 2 }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'roomy' },
  )
  const teaching = sec(
    'Teaching',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Areas', level: 2 }),
        newWidget('skillbar', { skills: skillItems(b, ['Lecturing', 'Supervision', 'Methods']) }),
      ]),
    ],
    { pad: 'normal' },
  )
  return { sections: [hero, about, work, teaching, contactSection(b, { bg: 'none' })] }
}

// Gallery: an image-first studio/photographer page — minimal text, big grid.
function gallerySeed(b: ResumeBits): PageData {
  const hero = sec(
    'Home',
    [
      newColumn(12, [
        newWidget('heading', { text: b.name.toUpperCase(), level: 1, align: 'center' }),
        newWidget('text', { html: `<p>${b.title}</p>` }),
      ]),
    ],
    { pad: 'roomy', full: true },
  )
  const work = sec(
    'Work',
    [
      newColumn(12, [
        newWidget('heading', { text: 'Work', level: 2, align: 'center' }),
        newWidget('portfolio', { items: [] }),
      ]),
    ],
    { pad: 'normal', full: true },
  )
  const about = sec(
    'About',
    [
      newColumn(12, [
        newWidget('heading', { text: 'About', level: 2, align: 'center' }),
        newWidget('text', {
          html: `<p>${b.summary || 'A short statement about your work and the way you see.'}</p>`,
        }),
      ]),
    ],
    { pad: 'roomy' },
  )
  return { sections: [hero, work, about, contactSection(b)] }
}

// Build the starter page for a given design.
export function buildDesignSeed(design: DesignId, resume: ResumeData): PageData {
  const b = resumeBits(resume)
  switch (design) {
    case 'minimal':
      return minimalSeed(b)
    case 'studio':
      return studioSeed(b)
    case 'bold':
      return boldSeed(b)
    case 'editorial':
      return editorialSeed(b)
    case 'developer':
      return developerSeed(b)
    case 'corporate':
      return corporateSeed(b)
    case 'academia':
      return academiaSeed(b)
    case 'gallery':
      return gallerySeed(b)
    case 'designer':
    default:
      return buildDesignerPage(resume)
  }
}

// A near-empty starter page for users who want to build from scratch.
export function blankPage(): PageData {
  return {
    sections: [
      sec(
        'Home',
        [
          newColumn(12, [
            newWidget('heading', { text: 'Your Name', level: 1 }),
            newWidget('text', { html: '<p>What you do, in one line.</p>' }),
          ]),
        ],
        { pad: 'roomy' },
      ),
    ],
  }
}
