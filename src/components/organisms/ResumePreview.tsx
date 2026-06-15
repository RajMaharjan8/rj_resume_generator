import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type {
  Block,
  FieldDef,
  ImageMeta,
  RepeaterRow,
  ResumeData,
  ResumeSettings,
} from '../../types'
import {
  MailIcon,
  PhoneIcon,
  PinIcon,
  GlobeIcon,
  LinkedInIcon,
  GithubIcon,
} from '../atoms/icons'

interface Props {
  data: ResumeData
  settings: ResumeSettings
}

const CONTACT_ICONS: Record<string, ReactNode> = {
  email: <MailIcon className="c-icon" />,
  phone: <PhoneIcon className="c-icon" />,
  location: <PinIcon className="c-icon" />,
  website: <GlobeIcon className="c-icon" />,
  linkedin: <LinkedInIcon className="c-icon" />,
  github: <GithubIcon className="c-icon" />,
}

const MM_PX = 96 / 25.4 // px per mm at 96dpi
const CONTENT_H = (297 - 32) * MM_PX // A4 height minus 16mm top+bottom margin

// "header" is the header unit; numbers index into data.blocks.
type Unit = 'header' | number

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data, settings }, ref) => {
  const style = {
    '--rs-accent': settings.accent,
    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontScale * 10.5}pt`,
  } as React.CSSProperties

  const measureRef = useRef<HTMLDivElement>(null)
  // Each page is a list of units (header / block indices).
  const [pages, setPages] = useState<Unit[][]>([['header', ...data.blocks.map((_, i) => i)]])

  // Measure each top-level unit and group them into A4-height pages.
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const compute = () => {
      const children = Array.from(el.children) as HTMLElement[]
      const result: Unit[][] = []
      let current: Unit[] = []
      let used = 0
      children.forEach((child) => {
        const unit = child.dataset.unit as string
        const h = child.offsetHeight
        if (current.length > 0 && used + h > CONTENT_H) {
          result.push(current)
          current = []
          used = 0
        }
        current.push(unit === 'header' ? 'header' : Number(unit))
        used += h
      })
      if (current.length) result.push(current)
      setPages(result.length ? result : [['header']])
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data, settings])

  const renderUnit = (u: Unit) =>
    u === 'header' ? <Header data={data} /> : <BlockView block={data.blocks[u]} />

  return (
    <div className="page-scroll">
      {/* Visible: real A4 page sheets. */}
      <div className="pages">
        {pages.map((units, p) => (
          <div
            key={p}
            className={`resume tpl-${settings.template} page-sheet`}
            style={style}
            {...(p === 0 ? { id: 'resume-page-first' } : {})}
          >
            {units.map((u) => (
              <div key={String(u)}>{renderUnit(u)}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Hidden measurer: every unit in one flow, tagged for measurement. */}
      <div className="resume-measure" aria-hidden="true">
        <div ref={measureRef} className={`resume tpl-${settings.template}`} style={style}>
          <div data-unit="header">
            <Header data={data} />
          </div>
          {data.blocks.map((block, i) => (
            <div key={block.id} data-unit={i}>
              <BlockView block={block} />
            </div>
          ))}
        </div>
      </div>

      {/* Continuous copy = the print/PDF target (browser paginates it). */}
      <div id="resume-page" ref={ref} className={`resume tpl-${settings.template} print-only`} style={style}>
        <Header data={data} />
        {data.blocks.map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
})
ResumePreview.displayName = 'ResumePreview'
export default ResumePreview

function Header({ data }: { data: ResumeData }) {
  const h = data.header
  const contacts = h.contacts.filter((c) => c.value)
  return (
    <header className="r-head">
      <div className="r-head-main">
        <div>
          <h1>{h.fullName || 'Your Name'}</h1>
          {h.title && <p className="r-title">{h.title}</p>}
        </div>
        {h.photo && (
          <img
            className={`r-photo ${h.photoShape === 'square' ? 'square' : ''}`}
            src={h.photo}
            alt=""
            style={{ width: h.photoSize ?? 64, height: h.photoSize ?? 64 }}
          />
        )}
      </div>
      {contacts.length > 0 && (
        <ul className="r-contacts">
          {contacts.map((c) => (
            <li key={c.id}>
              {CONTACT_ICONS[c.type] ?? <GlobeIcon className="c-icon" />}
              <a className="c-link" href={contactHref(c.type, c.value)} target="_blank" rel="noreferrer">
                {c.value}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}

// Turn a contact value into a clickable href: email → mailto, phone → tel,
// everything else → a web URL (prefixed with https:// if missing).
function contactHref(type: string, value: string): string {
  const v = value.trim()
  if (type === 'email') return `mailto:${v}`
  if (type === 'phone') return `tel:${v.replace(/[^\d+]/g, '')}`
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

function BlockView({ block }: { block: Block }) {
  // Hide a block entirely if it has no visible content.
  const hasContent = block.fields.some((f) => fieldHasValue(f, block.values[f.id]))
  if (!hasContent) return null

  const useGrid = block.grid && block.grid.length > 0
  const byId = new Map(block.fields.map((f) => [f.id, f]))

  return (
    <section className="r-block">
      {block.title && <h2 className="r-block-title">{block.title}</h2>}
      {useGrid ? (
        <>
          <div className="r-grid">
            {[...(block.grid ?? [])]
              .sort((a, b) => a.y - b.y || a.x - b.x)
              .map((g) => {
                const field = byId.get(g.fieldId)
                if (!field || !fieldHasValue(field, block.values[field.id])) return null
                return (
                  <div
                    key={g.fieldId}
                    className={`r-grid-item ${field.type === 'date' ? 'r-align-right' : ''}`}
                    style={{ gridColumn: `${g.x + 1} / span ${g.w}` }}
                  >
                    <FieldView field={field} value={block.values[field.id]} imageMeta={block.imageMeta?.[field.id]} />
                  </div>
                )
              })}
          </div>
          {/* Fields not placed on the grid (e.g. newly added) still render below. */}
          {block.fields
            .filter((f) => !block.grid?.some((g) => g.fieldId === f.id))
            .map((field) => (
              <div key={field.id} className={field.type === 'date' ? 'r-align-right' : undefined}>
                <FieldView field={field} value={block.values[field.id]} imageMeta={block.imageMeta?.[field.id]} />
              </div>
            ))}
        </>
      ) : (
        <div className="r-block-body">
          {block.fields.map((field, i) => {
            if (field.type === 'date') {
              // If the previous field exists it was already paired with this date
              // (rendered together). Otherwise show the date alone on the right.
              const prev = block.fields[i - 1]
              if (prev && prev.type !== 'date' && fieldHasValue(prev, block.values[prev.id])) {
                return null
              }
              if (!fieldHasValue(field, block.values[field.id])) return null
              return (
                <p key={field.id} className="r-text entry-meta r-align-right">
                  {block.values[field.id] as string}
                </p>
              )
            }

            // A following 'date' field renders to the right of this field's row.
            const next = block.fields[i + 1]
            const pairDate =
              next &&
              next.type === 'date' &&
              fieldHasValue(field, block.values[field.id]) &&
              fieldHasValue(next, block.values[next.id])

            if (pairDate) {
              return (
                <div key={field.id} className="r-headrow">
                  <div className="r-headrow-main">
                    <FieldView field={field} value={block.values[field.id]} imageMeta={block.imageMeta?.[field.id]} />
                  </div>
                  <span className="entry-meta">{block.values[next.id] as string}</span>
                </div>
              )
            }

            return (
              <div key={field.id} className={field.alignRight ? 'r-align-right' : undefined}>
                <FieldView
                  field={field}
                  value={block.values[field.id]}
                  imageMeta={block.imageMeta?.[field.id]}
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function FieldView({
  field,
  value,
  imageMeta,
}: {
  field: FieldDef
  value: unknown
  imageMeta?: ImageMeta
}) {
  if (!fieldHasValue(field, value)) return null

  switch (field.type) {
    case 'text':
      return <p className="r-text">{value as string}</p>

    case 'date':
      return <p className="r-text entry-meta">{value as string}</p>

    case 'textarea':
      // Rich text stored as sanitized-ish HTML from the editor.
      return (
        <div className="r-text r-rich" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value as string) }} />
      )

    case 'list':
      return (
        <ul className="r-list">
          {(value as string[]).filter((s) => s.trim()).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case 'tags':
      return (
        <ul className="skill-list">
          {(value as string[]).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )

    case 'image': {
      const size = imageMeta?.size ?? 120
      const shape = imageMeta?.shape ?? 'rounded'
      const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? '8px' : '0'
      return (
        <div className="r-img-wrap">
          <img
            className="r-field-img"
            src={value as string}
            alt={field.label}
            style={{ width: size, height: shape === 'circle' ? size : 'auto', borderRadius: radius, objectFit: 'cover' }}
          />
        </div>
      )
    }

    case 'repeater':
      return (
        <div className="r-entries">
          {(value as RepeaterRow[]).map((row, i) => (
            <RepeaterRowView
              key={(row.__id as string) ?? i}
              fields={field.fields ?? []}
              row={row}
            />
          ))}
        </div>
      )

    default:
      return null
  }
}

// Render a repeater row. A field marked "Align right" becomes the right-side
// meta (e.g. a date). The first text field is the title, the next text field
// (if any, before the right field) is the org. Everything else stacks below.
function RepeaterRowView({ fields, row }: { fields: FieldDef[]; row: RepeaterRow }) {
  const rightField = fields.find((f) => f.alignRight)
  // Implicit fallback for older blocks: 3rd text field acts as right meta.
  const textFields = fields.filter((f) => f.type === 'text')
  const right = rightField ?? (fields.some((f) => f.alignRight) ? undefined : textFields[2])

  const titleField = textFields.find((f) => f !== right)
  const orgField = textFields.find((f) => f !== right && f !== titleField)
  const rest = fields.filter((f) => f !== right && f !== titleField && f !== orgField)

  const titleVal = titleField ? (row[titleField.id] as string) : ''
  const orgVal = orgField ? (row[orgField.id] as string) : ''
  const rightVal = right ? (row[right.id] as string) : ''

  return (
    <div className="entry">
      {(titleVal || orgVal || rightVal) && (
        <div className="entry-head">
          <span className="entry-title">
            {titleVal}
            {orgVal && <span className="entry-org"> · {orgVal}</span>}
          </span>
          {rightVal && <span className="entry-meta">{rightVal}</span>}
        </div>
      )}
      {rest.map((f) => (
        <FieldView key={f.id} field={f} value={row[f.id]} />
      ))}
    </div>
  )
}

// Allow only a safe set of formatting tags from the rich-text editor
// (headings, lists, tables, links, alignment). Strips scripts/handlers.
const ALLOWED_TAGS =
  'b|strong|i|em|u|s|br|p|div|span|ul|ol|li|h1|h2|h3|a|table|thead|tbody|tr|th|td'
function sanitizeHtml(html: string): string {
  return html
    .replace(new RegExp(`<(?!\\/?(${ALLOWED_TAGS})\\b)[^>]*>`, 'gi'), '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

function fieldHasValue(field: FieldDef, value: unknown): boolean {
  switch (field.type) {
    case 'tags':
    case 'list':
    case 'repeater':
      return Array.isArray(value) && value.some((v) => String(v).trim().length > 0)
    case 'textarea':
      return typeof value === 'string' && value.replace(/<[^>]*>/g, '').trim().length > 0
    default:
      return typeof value === 'string' && value.trim().length > 0
  }
}
