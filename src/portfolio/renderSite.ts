// Renders portfolio blocks to plain HTML strings. Used BOTH for the live
// preview and the exported index.html, so they always match.
import type { Block, FieldDef, RepeaterRow } from '../types'
import type { BlockStyle, PortfolioData, SectionKind } from './types'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;')

const ALLOWED = 'b|strong|i|em|u|br|p|div|span|ul|ol|li|h1|h2|h3|a|table|thead|tbody|tr|th|td'
function sanitize(html: string): string {
  return html
    .replace(new RegExp(`<(?!\\/?(${ALLOWED})\\b)[^>]*>`, 'gi'), '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'section'

// Normalize a button/link URL (emails → mailto:).
function hrefOf(url: string): string {
  const u = url.trim()
  if (!u) return '#'
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return `mailto:${u}`
  return `https://${u}`
}

function fieldHtml(field: FieldDef, value: unknown): string {
  switch (field.type) {
    case 'text':
    case 'date':
      return typeof value === 'string' && value.trim() ? `<p class="pf-text">${esc(value)}</p>` : ''
    case 'textarea':
      return typeof value === 'string' && value.trim()
        ? `<div class="pf-rich">${sanitize(value)}</div>`
        : ''
    case 'button': {
      const [label = '', url = ''] = String(value ?? '').split('|')
      return label.trim()
        ? `<a class="pf-btn" href="${escAttr(hrefOf(url))}">${esc(label)}</a>`
        : ''
    }
    case 'tags':
      return Array.isArray(value) && value.length
        ? `<ul class="pf-tags">${value.map((t) => `<li>${esc(String(t))}</li>`).join('')}</ul>`
        : ''
    case 'list':
      return Array.isArray(value) && value.length
        ? `<ul class="pf-list">${(value as string[])
            .filter((s) => s.trim())
            .map((t) => `<li>${esc(t)}</li>`)
            .join('')}</ul>`
        : ''
    case 'skillbar':
      return Array.isArray(value) && value.length
        ? `<div class="pf-skills">${(value as string[])
            .filter((s) => s.trim())
            .map((s) => {
              const m = s.match(/^(.*?)(\d{1,3})\s*%?\s*$/)
              const name = (m ? m[1] : s).trim() || s.trim()
              const pct = Math.min(100, m ? Number(m[2]) : 80)
              return `<div class="pf-skill"><div class="pf-skill-head"><span>${esc(
                name,
              )}</span><span>${pct}%</span></div><div class="pf-skill-track"><div class="pf-skill-fill" style="width:${pct}%"></div></div></div>`
            })
            .join('')}</div>`
        : ''
    case 'image':
      return typeof value === 'string' && value
        ? `<img class="pf-img" src="${escAttr(value)}" alt="${escAttr(field.label)}" />`
        : ''
    case 'repeater':
      return Array.isArray(value) && value.length
        ? `<div class="pf-cards">${(value as RepeaterRow[])
            .map(
              (row) =>
                `<div class="pf-card">${(field.fields ?? [])
                  .map((sf) => fieldHtml(sf, row[sf.id]))
                  .join('')}</div>`,
            )
            .join('')}</div>`
        : ''
    default:
      return ''
  }
}

// Value helpers by field type.
const txt = (b: Block, type: FieldDef['type'], n = 0): string => {
  const fs = b.fields.filter((f) => f.type === type)
  const fd = fs[n]
  return fd ? String(b.values[fd.id] ?? '') : ''
}
const arr = (b: Block, type: FieldDef['type']): string[] => {
  const fd = b.fields.find((f) => f.type === type)
  return fd && Array.isArray(b.values[fd.id]) ? (b.values[fd.id] as string[]) : []
}
const rows = (b: Block): { fields: FieldDef[]; rows: RepeaterRow[] } => {
  const fd = b.fields.find((f) => f.type === 'repeater')
  return { fields: fd?.fields ?? [], rows: fd && Array.isArray(b.values[fd.id]) ? (b.values[fd.id] as RepeaterRow[]) : [] }
}
const btnHtml = (b: Block): string => {
  const fd = b.fields.find((f) => f.type === 'button')
  return fd ? fieldHtml(fd, b.values[fd.id]) : ''
}

// --- Exact reference sections ---
function heroSection(b: Block): string {
  const eyebrow = txt(b, 'text', 0)
  const name = txt(b, 'text', 1) || txt(b, 'text', 0)
  const mark = name.replace(/[^\w\s]/g, '').split(/\s+/).slice(-1)[0] || ''
  return `<section class="pf-section pf-hero pf-reveal" id="${slug(b.title)}">
  ${mark ? `<span class="pf-hero-mark" aria-hidden="true">${esc(mark)}</span>` : ''}
  <div class="pf-container pf-hero-inner">
    ${eyebrow ? `<p class="pf-hero-eyebrow">${esc(eyebrow)}</p>` : ''}
    <h1 class="pf-hero-name">${esc(name)}<span class="pf-dot">.</span></h1>
    ${btnHtml(b)}
  </div>
</section>`
}

function aboutSection(b: Block): string {
  const photo = txt(b, 'image', 0)
  const name = txt(b, 'text', 0)
  const bio = txt(b, 'textarea', 0)
  const edu = txt(b, 'textarea', 1)
  const info = arr(b, 'list')
  const infoHtml = info
    .filter((l) => l.trim())
    .map((l) => {
      const [k, ...rest] = l.split(':')
      const v = rest.join(':').trim()
      return `<div class="pf-info-item"><span class="pf-info-k">${esc(k)}</span><span class="pf-info-v">${esc(v)}</span></div>`
    })
    .join('')
  return `<section class="pf-section pf-about pf-reveal" id="${slug(b.title)}">
  <div class="pf-container">
    <h2 class="pf-heading">${esc(b.title)}</h2>
    <div class="pf-about-grid">
      ${photo ? `<div class="pf-about-photo"><img src="${escAttr(photo)}" alt="${escAttr(name)}" /></div>` : '<div></div>'}
      <div class="pf-about-body">
        ${name ? `<p class="pf-about-name">${esc(name)}</p>` : ''}
        ${bio ? `<div class="pf-rich pf-about-bio">${sanitize(bio)}</div>` : ''}
        ${infoHtml ? `<div class="pf-info">${infoHtml}</div>` : ''}
        ${edu ? `<div class="pf-rich pf-about-edu">${sanitize(edu)}</div>` : ''}
      </div>
    </div>
  </div>
</section>`
}

function skillsSection(b: Block): string {
  const fd = b.fields.find((f) => f.type === 'skillbar')
  const inner = fd ? fieldHtml(fd, b.values[fd.id]) : ''
  return `<section class="pf-section pf-skills-sec pf-reveal" id="${slug(b.title)}">
  <div class="pf-container"><h2 class="pf-heading">${esc(b.title)}</h2>${inner}</div>
</section>`
}

function availableSection(b: Block): string {
  const t = txt(b, 'text', 0)
  return `<section class="pf-section pf-available pf-reveal" id="${slug(b.title)}">
  <div class="pf-container"><p class="pf-available-text">${esc(t)}</p></div>
</section>`
}

function portfolioSection(b: Block): string {
  const { fields, rows: rs } = rows(b)
  const imgF = fields.find((f) => f.type === 'image')
  const titleF = fields.find((f) => f.type === 'text')
  const items = rs
    .map((r) => {
      const img = imgF ? String(r[imgF.id] ?? '') : ''
      const title = titleF ? String(r[titleF.id] ?? '') : ''
      if (!img && !title) return ''
      return `<figure class="pf-pf-item">${img ? `<img src="${escAttr(img)}" alt="${escAttr(title)}" />` : ''}${title ? `<figcaption>${esc(title)}</figcaption>` : ''}</figure>`
    })
    .join('')
  return `<section class="pf-section pf-portfolio pf-reveal" id="${slug(b.title)}">
  <div class="pf-container"><h2 class="pf-heading">${esc(b.title)}</h2><div class="pf-pf-grid">${items}</div></div>
</section>`
}

function servicesSection(b: Block): string {
  const { fields, rows: rs } = rows(b)
  const titleF = fields.find((f) => f.type === 'text')
  const descF = fields.find((f) => f.type === 'textarea')
  const items = rs
    .map((r) => {
      const title = titleF ? String(r[titleF.id] ?? '') : ''
      const desc = descF ? String(r[descF.id] ?? '') : ''
      if (!title) return ''
      const initial = title.trim().charAt(0).toUpperCase()
      return `<div class="pf-svc"><span class="pf-svc-icon">${esc(initial)}</span><h3 class="pf-svc-title">${esc(title)}</h3>${desc ? `<div class="pf-rich pf-svc-desc">${sanitize(desc)}</div>` : ''}</div>`
    })
    .join('')
  return `<section class="pf-section pf-services pf-reveal" id="${slug(b.title)}">
  <div class="pf-container"><h2 class="pf-heading">${esc(b.title)}</h2><div class="pf-svc-grid">${items}</div></div>
</section>`
}

function contactSection(b: Block): string {
  const phone = txt(b, 'text', 0)
  const email = txt(b, 'text', 1)
  const addr = txt(b, 'text', 2)
  const col = (label: string, val: string) =>
    val ? `<div class="pf-contact-col"><span class="pf-contact-label">${esc(label)}</span><span class="pf-contact-val">${esc(val)}</span></div>` : ''
  return `<section class="pf-section pf-contact pf-reveal" id="${slug(b.title)}">
  <div class="pf-container">
    <h2 class="pf-heading pf-contact-heading">${esc(b.title)}</h2>
    <div class="pf-contact-cols">
      ${col('Call us on', phone)}
      ${col('Email us at', email)}
      ${col('Visit office', addr)}
    </div>
    <div class="pf-contact-btn">${btnHtml(b)}</div>
  </div>
</section>`
}

function blockHtml(block: Block, style?: BlockStyle): string {
  const id = slug(block.title)
  let inner: string
  if (block.grid && block.grid.length) {
    const byId = new Map(block.fields.map((f) => [f.id, f]))
    const cells = [...block.grid]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((g) => {
        const f = byId.get(g.fieldId)
        if (!f) return ''
        return `<div class="pf-cell" style="grid-column:${g.x + 1}/span ${g.w}">${fieldHtml(
          f,
          block.values[f.id],
        )}</div>`
      })
      .join('')
    inner = `<div class="pf-grid">${cells}</div>`
  } else {
    inner = block.fields.map((f) => fieldHtml(f, block.values[f.id])).join('')
  }
  const cls = [
    'pf-section',
    'pf-reveal',
    `bg-${style?.bg ?? 'none'}`,
    `pad-${style?.pad ?? 'normal'}`,
    `align-${style?.align ?? 'left'}`,
  ].join(' ')
  return `<section class="${cls}" id="${id}">
  <div class="pf-container">
    <h2 class="pf-section-title">${esc(block.title)}</h2>
    ${inner}
  </div>
</section>`
}

// Dispatch a block to its exact section renderer based on kind.
function sectionHtml(b: Block, kind: SectionKind | undefined, style?: BlockStyle): string {
  switch (kind) {
    case 'hero':
      return heroSection(b)
    case 'about':
      return aboutSection(b)
    case 'skills':
      return skillsSection(b)
    case 'available':
      return availableSection(b)
    case 'portfolio':
      return portfolioSection(b)
    case 'services':
      return servicesSection(b)
    case 'contact':
      return contactSection(b)
    default:
      return blockHtml(b, style)
  }
}

// The <body> inner HTML (nav + sections + footer). Shared by preview + export.
export function renderBodyInner(data: PortfolioData): string {
  const styles = data.styles ?? {}
  const kinds = data.kinds ?? {}
  const nav = data.blocks
    .map((b) => `<a href="#${slug(b.title)}">${esc(b.title)}</a>`)
    .join('')
  const email = (data.settings.contactEmail ?? '').trim()
  const footerContact = email
    ? `<a class="pf-foot-link" href="mailto:${escAttr(email)}">${esc(email)}</a>`
    : ''
  return `<header class="pf-nav">
  <div class="pf-container pf-nav-inner">
    <span class="pf-brand">${esc(data.settings.siteTitle)}</span>
    <div class="pf-nav-right">
      <nav class="pf-links">${nav}</nav>
      <button class="pf-theme-toggle" aria-label="Toggle theme" title="Toggle theme">◐</button>
      <button class="pf-nav-toggle" aria-label="Menu">&#9776;</button>
    </div>
  </div>
</header>
<main>
${data.blocks.map((b) => sectionHtml(b, kinds[b.id], styles[b.id])).join('\n')}
</main>
<footer class="pf-footer">
  <div class="pf-container pf-footer-inner">
    <span>© <span id="pf-year"></span> ${esc(data.settings.siteTitle)}</span>
    ${footerContact}
  </div>
</footer>`
}
