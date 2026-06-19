// Renders a PageData document to HTML. Shared by the live canvas preview-feel
// styling and the exported index.html so they match exactly.
import type { PortfolioData } from '../types'
import { readableOn } from '../siteStyles'
import { sectionRows, type Column, type PageData, type Row, type Section, type Widget } from './model'

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

function hrefOf(url: string): string {
  const u = (url ?? '').trim()
  if (!u) return '#'
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return `mailto:${u}`
  return `https://${u}`
}

// Convert a YouTube/Vimeo URL to an embeddable iframe src.
function embedSrc(url: string): string {
  const u = url.trim()
  const yt = u.match(/(?:youtu\.be\/|v=)([\w-]{6,})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = u.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return u
}

function widgetHtml(w: Widget): string {
  const alignCls = w.align ? ` pf-align-${w.align}` : ''
  switch (w.type) {
    case 'heading': {
      const tag = `h${w.level ?? 2}`
      const t = (w.text ?? '').trim()
      if (!t) return ''
      const dot = w.level === 1 ? '<span class="pf-dot">.</span>' : ''
      return `<${tag} class="pf-w-heading${alignCls}">${esc(t)}${dot}</${tag}>`
    }
    case 'text':
      return (w.html ?? '').trim() ? `<div class="pf-w-text${alignCls}">${sanitize(w.html!)}</div>` : ''
    case 'image': {
      if (!w.src) return ''
      const shape = w.shape ?? (w.rounded ? 'rounded' : 'square')
      const width = Math.min(100, Math.max(10, w.width ?? 100))
      // 'contain' shows the whole image as-is; default keeps the cover crop.
      const fitCls = w.fit === 'contain' ? ' fit-contain' : ''
      const wrapCls = `pf-w-image-wrap${alignCls}`
      return `<div class="${wrapCls}"><img class="pf-w-image shape-${shape}${fitCls}" style="width:${width}%" src="${escAttr(
        w.src,
      )}" alt="${escAttr(w.alt ?? '')}" /></div>`
    }
    case 'button': {
      const label = (w.text ?? '').trim()
      return label
        ? `<div class="pf-w-btn-wrap${alignCls}"><a class="pf-btn" href="${escAttr(
            hrefOf(w.url ?? ''),
          )}">${esc(label)}</a></div>`
        : ''
    }
    case 'icon':
      return `<div class="pf-w-icon${alignCls}">${esc(w.text ?? '★')}</div>`
    case 'spacer':
      return `<div class="pf-w-spacer" style="height:${Math.max(0, w.height ?? 32)}px"></div>`
    case 'video': {
      const src = embedSrc(w.url ?? '')
      return src
        ? `<div class="pf-w-video"><iframe src="${escAttr(
            src,
          )}" allowfullscreen loading="lazy" title="video"></iframe></div>`
        : ''
    }
    case 'gallery': {
      const items = (w.items ?? []).filter((it) => it.image)
      return items.length
        ? `<div class="pf-w-gallery">${items
            .map(
              (it) =>
                `<figure class="pf-g-item">${
                  it.link
                    ? `<a href="${escAttr(hrefOf(it.link))}"><img src="${escAttr(
                        it.image,
                      )}" alt="${escAttr(it.title)}" /></a>`
                    : `<img src="${escAttr(it.image)}" alt="${escAttr(it.title)}" />`
                }${it.title ? `<figcaption>${esc(it.title)}</figcaption>` : ''}</figure>`,
            )
            .join('')}</div>`
        : ''
    }
    case 'portfolio': {
      const items = (w.items ?? []).filter((it) => it.image || it.title)
      return `<div class="pf-pf-grid">${items
        .map(
          (it) =>
            `<figure class="pf-pf-item">${
              it.image ? `<img src="${escAttr(it.image)}" alt="${escAttr(it.title)}" />` : ''
            }${it.title ? `<figcaption>${esc(it.title)}</figcaption>` : ''}</figure>`,
        )
        .join('')}</div>`
    }
    case 'skillbar': {
      const skills = (w.skills ?? []).filter((s) => s.label.trim())
      return `<div class="pf-skills">${skills
        .map((s) => {
          const pct = Math.min(100, Math.max(0, Math.round(s.pct)))
          return `<div class="pf-skill"><div class="pf-skill-head"><span>${esc(
            s.label,
          )}</span><span>${pct}%</span></div><div class="pf-skill-track"><div class="pf-skill-fill" style="width:${pct}%"></div></div></div>`
        })
        .join('')}</div>`
    }
    case 'services': {
      const items = (w.services ?? []).filter((s) => s.title.trim())
      return `<div class="pf-svc-grid">${items
        .map(
          (s) =>
            `<div class="pf-svc"><span class="pf-svc-icon">${esc(
              (s.icon || s.title.charAt(0)).toUpperCase(),
            )}</span><h3 class="pf-svc-title">${esc(s.title)}</h3>${
              s.desc ? `<p class="pf-svc-desc">${esc(s.desc)}</p>` : ''
            }</div>`,
        )
        .join('')}</div>`
    }
    case 'contact': {
      const cols = (w.cols ?? []).filter((c) => c.value.trim())
      const label = (w.text ?? '').trim()
      return `<div class="pf-contact-block">
  <div class="pf-contact-cols">${cols
    .map(
      (c) =>
        `<div class="pf-contact-col"><span class="pf-contact-label">${esc(
          c.label,
        )}</span><span class="pf-contact-val">${esc(c.value)}</span></div>`,
    )
    .join('')}</div>
  ${label ? `<div class="pf-contact-btn"><a class="pf-btn" href="${escAttr(hrefOf(w.url ?? ''))}">${esc(label)}</a></div>` : ''}
</div>`
    }
    case 'webblock':
      // Web blocks are expanded by the caller (needs the library). Placeholder.
      return ''
    default:
      return ''
  }
}

function columnHtml(col: Column): string {
  return `<div class="pf-col" style="grid-column:span ${col.span}">${col.widgets
    .map(widgetHtml)
    .join('')}</div>`
}

function rowHtml(row: Row): string {
  const cls = `pf-row${row.auto ? ' is-auto' : ''}`
  return `<div class="${cls}">${row.columns.map(columnHtml).join('')}</div>`
}

// Inline style for a section's custom background. We set --bg/--soft/--card too
// so descendant tokens (cards, skill tracks) sit on the chosen colour, and flip
// --text/--muted for readability. A custom colour wins over the bg-* preset.
function sectionBgStyle(color: string): string {
  const c = color.trim()
  const text = readableOn(c)
  const parts = [`background:${c}`, `--bg:${c}`, `--soft:${c}`, `--card:${c}`]
  if (text) {
    parts.push(`color:${text}`, `--text:${text}`)
    parts.push(`--muted:color-mix(in srgb, ${text} 60%, ${c})`)
    parts.push(`--border:color-mix(in srgb, ${text} 18%, ${c})`)
  }
  return parts.join(';')
}

function sectionHtml(sec: Section): string {
  const customBg = (sec.bgColor ?? '').trim()
  const cls = [
    'pf-section',
    'pf-reveal',
    // A custom colour replaces the preset, so drop bg-* when bgColor is set.
    customBg ? 'bg-custom' : `bg-${sec.bg ?? 'none'}`,
    `pad-${sec.pad ?? 'normal'}`,
    sec.full ? 'is-full' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const style = customBg ? ` style="${sectionBgStyle(customBg)}"` : ''
  return `<section class="${cls}"${style} id="${slug(sec.name)}">
  <div class="pf-container">${sectionRows(sec).map(rowHtml).join('')}</div>
</section>`
}

export function renderPageMain(page: PageData): string {
  return page.sections.map(sectionHtml).join('\n')
}

// Footer left text with {year}/{title} placeholders expanded. {year} becomes a
// span that script.js fills in; {title} is the site title.
export function footerTextHtml(data: PortfolioData): string {
  const tpl = (data.settings.footerText ?? '© {year} {title}').trim()
  return esc(tpl)
    .replace(/\{year\}/g, '<span id="pf-year"></span>')
    .replace(/\{title\}/g, esc(data.settings.siteTitle))
}

// The footer's inner markup (left text + right links). Shared by canvas + export.
export function footerInner(data: PortfolioData): string {
  const email = (data.settings.contactEmail ?? '').trim()
  const showEmail = data.settings.footerShowEmail !== false
  const links = (data.settings.footerLinks ?? []).filter((l) => l.label.trim())
  const linkHtml = [
    ...links.map(
      (l) => `<a class="pf-foot-link" href="${escAttr(hrefOf(l.url))}">${esc(l.label)}</a>`,
    ),
    showEmail && email ? `<a class="pf-foot-link" href="mailto:${escAttr(email)}">${esc(email)}</a>` : '',
  ]
    .filter(Boolean)
    .join('')
  return `<span class="pf-foot-text">${footerTextHtml(data)}</span>
    <div class="pf-foot-links">${linkHtml}</div>`
}

// Full <body> inner (nav + sections + footer) from a page-based portfolio.
export function renderPageBody(data: PortfolioData, page: PageData): string {
  const nav = page.sections
    .filter((s) => !s.hideInNav)
    .map((s) => `<a href="#${slug(s.name)}">${esc(s.name)}</a>`)
    .join('')
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
${renderPageMain(page)}
</main>
<footer class="pf-footer">
  <div class="pf-container pf-footer-inner">
    ${footerInner(data)}
  </div>
</footer>`
}
