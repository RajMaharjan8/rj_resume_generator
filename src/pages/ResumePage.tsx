import { useRef, useState } from 'react'
import { useWorkspace } from '../WorkspaceContext'
import Customizer from '../components/molecules/Customizer'
import Editor from '../components/organisms/Editor'
import ResumePreview from '../components/organisms/ResumePreview'
import Footer from '../components/atoms/Footer'

export default function ResumePage() {
  const { resume, insertFromLibrary } = useWorkspace()
  const { data, setData, settings, setSettings } = resume
  const previewRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  return (
    <>
      <div className="mobile-tabs">
        <button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>
          Edit
        </button>
        <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
          Preview
        </button>
      </div>

      <main className="layout">
        <div className={`pane left ${tab === 'edit' ? '' : 'hide-mobile'}`}>
          <Customizer settings={settings} onChange={setSettings} />
          <Editor data={data} onChange={setData} onInsertFromLibrary={insertFromLibrary} />
          <Footer />
        </div>
        <div className={`pane right ${tab === 'preview' ? '' : 'hide-mobile'}`}>
          <ResumePreview ref={previewRef} data={data} settings={settings} />
        </div>
      </main>
    </>
  )
}
