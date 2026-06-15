import { renderBodyInner } from './renderSite'
import { siteCss } from './siteStyles'
import type { PortfolioData } from './types'

// Live website preview — uses the SAME HTML + CSS as the export, scoped under
// .pf-preview so it doesn't affect the app chrome.
export default function PortfolioPreview({ data }: { data: PortfolioData }) {
  return (
    <div className="pf-preview-wrap">
      <style>{siteCss(data, '.pf-preview')}</style>
      <div
        className="pf-preview"
        data-theme={data.settings.theme}
        dangerouslySetInnerHTML={{ __html: renderBodyInner(data) }}
      />
    </div>
  )
}
