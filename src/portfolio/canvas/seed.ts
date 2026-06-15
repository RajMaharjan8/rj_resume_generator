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
