import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { useEffect } from 'react'
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  LinkIcon,
  TableIcon,
} from '../atoms/icons'

interface Props {
  value: string // HTML
  onChange: (html: string) => void
}

// Full rich-text editor built on TipTap: headings, bold/italic/underline,
// alignment, bullet/number lists, links, and tables.
export default function RichText({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync external value changes (e.g. switching which field is edited).
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const btn = (active: boolean) => `rt-btn ${active ? 'active' : ''}`

  return (
    <div className="rt">
      <div className="rt-toolbar">
        <select
          className="rt-select"
          value={headingValue(editor)}
          onChange={(e) => setHeading(editor, e.target.value)}
        >
          <option value="p">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <span className="rt-sep" />

        <button type="button" className={btn(editor.isActive('bold'))} title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon />
        </button>
        <button type="button" className={btn(editor.isActive('italic'))} title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon />
        </button>
        <button type="button" className={btn(editor.isActive('underline'))} title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="rt-u">U</span>
        </button>

        <span className="rt-sep" />

        <button type="button" className={btn(editor.isActive('bulletList'))} title="Bullet list" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListIcon />
        </button>
        <button type="button" className={btn(editor.isActive('orderedList'))} title="Numbered list" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <span className="rt-ol">1.</span>
        </button>

        <span className="rt-sep" />

        <button type="button" className={btn(editor.isActive({ textAlign: 'left' }))} title="Align left" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeftIcon />
        </button>
        <button type="button" className={btn(editor.isActive({ textAlign: 'center' }))} title="Align center" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenterIcon />
        </button>
        <button type="button" className={btn(editor.isActive({ textAlign: 'right' }))} title="Align right" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRightIcon />
        </button>

        <span className="rt-sep" />

        <button type="button" className="rt-btn" title="Insert link" onMouseDown={(e) => e.preventDefault()} onClick={() => setLink(editor)}>
          <LinkIcon />
        </button>
        <button type="button" className="rt-btn" title="Insert table" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}>
          <TableIcon />
        </button>
      </div>

      <EditorContent editor={editor} className="rt-area input" />
    </div>
  )
}

function headingValue(editor: Editor): string {
  for (const lvl of [1, 2, 3] as const) {
    if (editor.isActive('heading', { level: lvl })) return String(lvl)
  }
  return 'p'
}

function setHeading(editor: Editor, v: string) {
  if (v === 'p') editor.chain().focus().setParagraph().run()
  else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 }).run()
}

function setLink(editor: Editor) {
  const prev = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('Link URL', prev ?? 'https://')
  if (url === null) return
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
