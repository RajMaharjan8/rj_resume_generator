import type { PortfolioData } from './types'

// Pick a readable text colour (near-black or near-white) for a given background.
// Parses #rgb / #rrggbb / rgb(); for anything else (named, hsl, gradients) we
// can't measure luminance, so we return null and let the theme's --text stand.
export function readableOn(bg: string): string | null {
  const c = bg.trim()
  let r: number, g: number, b: number
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((x) => x + x).join('')
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
  } else {
    const rgb = c.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
    if (!rgb) return null
    r = +rgb[1]
    g = +rgb[2]
    b = +rgb[3]
  }
  // Perceived luminance (sRGB weights). High → dark text, low → light text.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#16181e' : '#f3f4f8'
}

// The portfolio site CSS, shared by the live preview and the exported style.css.
// `scope` lets the preview scope rules under .pf-preview without affecting the app.
export function siteCss(data: PortfolioData, scope = ''): string {
  const s = scope ? `${scope} ` : ''
  const root = scope || ':root'
  // Custom page background overrides the theme's --bg, and flips --text so body
  // copy stays readable on it.
  const pageBg = (data.settings.pageBg ?? '').trim()
  const pageBgCss = pageBg
    ? `${root}, ${scope ? `${scope}[data-theme="dark"]` : `${root}[data-theme="dark"]`} { --bg: ${pageBg};${
        readableOn(pageBg) ? ` --text: ${readableOn(pageBg)};` : ''
      } }\n`
    : ''
  return `${root} {
  --accent: ${data.settings.accent};
  --accent-soft: color-mix(in srgb, var(--accent) 14%, transparent);
  --font: ${data.settings.fontFamily};
  --text: #14161c;
  --muted: #6b7280;
  --bg: #ffffff;
  --soft: #f6f6f8;
  --card: #ffffff;
  --border: #ececef;
  --shadow: 0 10px 30px rgba(20, 22, 28, 0.08);
}
${scope ? `${scope}[data-theme="dark"], ` : ''}${root}[data-theme="dark"] {
  --text: #ecedf1;
  --muted: #9aa1ad;
  --bg: #0e0f13;
  --soft: #16181e;
  --card: #16181e;
  --border: #262932;
  --shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
${s}* { box-sizing: border-box; }
${s ? `${scope} {` : 'body {'} margin: 0; font-family: var(--font); color: var(--text); background: var(--bg); line-height: 1.65; -webkit-font-smoothing: antialiased; }
${s}img { max-width: 100%; }
${s}a { color: var(--accent); text-decoration: none; }
${s}.pf-container { max-width: 1000px; margin: 0 auto; padding: 0 28px; }

/* Nav */
${s}.pf-nav { position: sticky; top: 0; background: color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); z-index: 20; }
${s}.pf-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
${s}.pf-brand { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
${s}.pf-nav-right { display: flex; align-items: center; gap: 20px; }
${s}.pf-links { display: flex; gap: 22px; }
${s}.pf-links a { color: var(--text); font-weight: 500; font-size: 15px; position: relative; opacity: 0.85; transition: opacity 0.2s; }
${s}.pf-links a:hover { opacity: 1; }
${s}.pf-links a::after { content: ''; position: absolute; left: 0; right: 100%; bottom: -4px; height: 2px; background: var(--accent); transition: right 0.25s ease; }
${s}.pf-links a:hover::after { right: 0; }
${s}.pf-theme-toggle, ${scope ? scope + ' ' : ''}.pf-nav-toggle { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text); line-height: 1; }
${s}.pf-nav-toggle { display: none; }

/* Sections */
${s}.pf-section { padding: 72px 0; }
${s}.pf-section.pad-compact { padding: 44px 0; }
${s}.pf-section.pad-roomy { padding: 112px 0; }
${s}.pf-section.align-center { text-align: center; }
${s}.pf-section.align-center .pf-tags, ${scope ? scope + ' ' : ''}.pf-section.align-center .pf-cards { justify-content: center; }
${s}.pf-section.bg-soft { background: var(--soft); }
${s}.pf-section.bg-accent { background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000)); color: #fff; }
${s}.pf-section.bg-accent .pf-section-title, ${scope ? scope + ' ' : ''}.pf-section.bg-accent a:not(.pf-btn) { color: #fff; }
${s}.pf-section.bg-accent .pf-btn { background: #fff; color: var(--accent) !important; }
${s}.pf-section.bg-dark { background: #101216; color: #eef0f3; }
${s}.pf-section.bg-dark .pf-section-title { color: #fff; }

/* Dedicated hero with ghost watermark */
${s}.pf-hero { position: relative; overflow: hidden; padding: 120px 0 104px; text-align: center;
    background: radial-gradient(900px 420px at 50% -10%, var(--accent-soft), transparent 70%); }
${s}.pf-hero-mark { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    font-size: clamp(120px, 22vw, 280px); font-weight: 700; letter-spacing: -0.04em;
    color: var(--text); opacity: 0.05; white-space: nowrap; pointer-events: none; text-transform: uppercase; }
${s}.pf-hero-inner { position: relative; display: flex; flex-direction: column; align-items: center; }
${s}.pf-hero-photo { width: 168px; height: 168px; border-radius: 50%; object-fit: cover; border: 5px solid var(--card); box-shadow: var(--shadow); margin-bottom: 28px; }
${s}.pf-hero-eyebrow { font-size: 16px; color: var(--muted); font-weight: 500; margin: 0 0 6px; letter-spacing: 0.02em; }
${s}.pf-hero-name { font-size: clamp(40px, 7vw, 64px); line-height: 1.02; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 18px; }
${s}.pf-hero-intro { max-width: 580px; color: var(--muted); font-size: 17px; }

${s}.pf-section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent); margin: 0 0 22px; font-weight: 600; }
${s}.pf-section.align-center .pf-section-title { margin-bottom: 14px; }
${s}.pf-text { margin: 0 0 12px; font-size: 17px; color: var(--text); }
${s}.pf-rich { color: var(--muted); font-size: 16px; }

/* Skill bars */
${s}.pf-skills { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 36px; }
${s}.pf-skill-head { display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: var(--text); }
${s}.pf-skill-track { height: 7px; border-radius: 999px; background: var(--border); overflow: hidden; }
${s}.pf-skill-fill { height: 100%; border-radius: 999px; background: var(--accent); }
@media (max-width: 760px) { ${s}.pf-skills { grid-template-columns: 1fr; } }
${s}.pf-rich h1, ${scope ? scope + ' ' : ''}.pf-rich h2 { color: var(--text); }

${s}.pf-img { border-radius: 16px; display: inline-block; margin: 10px 0; max-width: 200px; box-shadow: var(--shadow); }
${s}.pf-section.align-center .pf-img { margin-left: auto; margin-right: auto; }

/* Buttons */
${s}.pf-btn { display: inline-block; background: var(--accent); color: #fff !important; padding: 12px 26px; border-radius: 999px; font-weight: 600; font-size: 15px; margin-top: 14px; box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 35%, transparent); transition: transform 0.18s ease, box-shadow 0.18s ease; }
${s}.pf-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 26px color-mix(in srgb, var(--accent) 45%, transparent); }

/* Tags */
${s}.pf-tags { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 10px; }
${s}.pf-tags li { background: var(--accent-soft); color: var(--accent); padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; }
${s}.pf-list { padding-left: 20px; margin: 8px 0; color: var(--muted); }

/* Grid + cards */
${s}.pf-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px 28px; align-items: start; }
${s}.pf-cell { min-width: 0; }
${s}.pf-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
${s}.pf-card { border: 1px solid var(--border); border-radius: 16px; padding: 22px; background: var(--card); text-align: left; box-shadow: var(--shadow); transition: transform 0.2s ease, box-shadow 0.2s ease; }
${s}.pf-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(20,22,28,0.14); }
${s}.pf-card .pf-text:first-child { font-weight: 700; font-size: 18px; }

/* Footer */
${s}.pf-footer { padding: 36px 0; color: var(--muted); font-size: 14px; border-top: 1px solid var(--border); }
${s}.pf-footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
${s}.pf-foot-links { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
${s}.pf-foot-link { color: var(--accent); font-weight: 500; }
${s}.pf-foot-link:hover { text-decoration: underline; }

/* ===== Reference "Designer" sections ===== */
${s}.pf-heading { text-align: center; font-size: 34px; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 40px; color: var(--accent); position: relative; }
${s}.pf-dot { color: var(--accent); }

/* Hero: left-aligned, watermark, accent dot, small contact button */
${s}.pf-hero { text-align: left; padding: 150px 0 130px; }
${s}.pf-hero-inner { align-items: flex-start; }
${s}.pf-hero-eyebrow { font-size: 28px; color: color-mix(in srgb, var(--text) 35%, transparent); font-weight: 600; margin: 0 0 4px; }
${s}.pf-hero-name { font-size: clamp(48px, 9vw, 92px); line-height: 0.98; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; margin: 0 0 22px; }
${s}.pf-hero .pf-btn { margin-top: 0; padding: 9px 22px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }

/* About: photo with offset accent frame + 2-col info grid */
${s}.pf-about-grid { display: grid; grid-template-columns: 300px 1fr; gap: 56px; align-items: start; }
${s}.pf-about-photo { position: relative; }
${s}.pf-about-photo::before { content: ''; position: absolute; inset: 18px -18px -18px 18px; border: 3px solid var(--accent); border-radius: 4px; z-index: 0; }
${s}.pf-about-photo img { position: relative; z-index: 1; width: 100%; border-radius: 4px; display: block; }
${s}.pf-about-name { font-weight: 600; margin: 0 0 12px; }
${s}.pf-about-bio { margin-bottom: 18px; }
${s}.pf-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-top: 8px; }
${s}.pf-info-k { display: block; color: var(--accent); font-weight: 600; font-size: 13px; }
${s}.pf-info-v { display: block; font-size: 14px; }
${s}.pf-about-edu { margin-top: 18px; text-align: center; }

/* Available band */
${s}.pf-available { text-align: center; }
${s}.pf-available-text { font-size: 26px; font-weight: 700; margin: 0; }

/* Portfolio image grid */
${s}.pf-pf-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
${s}.pf-pf-item { margin: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; aspect-ratio: 1 / 1; display: flex; flex-direction: column; }
${s}.pf-pf-item img { width: 100%; height: 100%; object-fit: cover; }
${s}.pf-pf-item figcaption { padding: 8px; font-size: 13px; text-align: center; color: var(--muted); }

/* Services icon grid (3 columns) */
${s}.pf-svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px 28px; text-align: center; }
${s}.pf-svc-icon { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 12px; background: var(--accent-soft); color: var(--accent); font-size: 24px; font-weight: 700; margin-bottom: 14px; }
${s}.pf-svc-title { font-size: 17px; font-weight: 700; margin: 0 0 6px; }
${s}.pf-svc-desc { color: var(--muted); font-size: 14px; }

/* Contact accent band */
${s}.pf-contact { background: var(--accent); color: #fff; text-align: center; }
${s}.pf-contact-heading { color: #fff; }
${s}.pf-contact-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 760px; margin: 0 auto 28px; }
${s}.pf-contact-label { display: block; font-weight: 700; margin-bottom: 4px; }
${s}.pf-contact-val { display: block; opacity: 0.95; font-size: 15px; }
${s}.pf-contact .pf-btn { background: #fff; color: var(--accent) !important; box-shadow: none; }

/* Scroll reveal */
${s}.pf-section { opacity: 1; }
${scope ? '' : `.pf-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.pf-reveal.in { opacity: 1; transform: none; }`}

@media (max-width: 760px) {
  ${s}.pf-links { position: absolute; top: 64px; left: 0; right: 0; background: var(--bg); flex-direction: column; padding: 16px 28px; border-bottom: 1px solid var(--border); display: none; gap: 14px; }
  ${s}.pf-links.open { display: flex; }
  ${s}.pf-nav-toggle { display: block; }
  ${s}.pf-grid { grid-template-columns: 1fr; }
  ${s}.pf-cell { grid-column: 1 / -1 !important; }
  ${s}.pf-section { padding: 52px 0; }
  ${s}.pf-hero { padding: 92px 0 72px; }
  ${s}.pf-skills { grid-template-columns: 1fr; }
  ${s}.pf-about-grid { grid-template-columns: 1fr; gap: 40px; }
  ${s}.pf-about-photo { max-width: 260px; }
  ${s}.pf-pf-grid { grid-template-columns: 1fr 1fr; }
  ${s}.pf-svc-grid { grid-template-columns: 1fr 1fr; gap: 28px 18px; }
  ${s}.pf-contact-cols { grid-template-columns: 1fr; gap: 18px; }
}
@media (max-width: 480px) {
  ${s}.pf-pf-grid, ${scope ? scope + ' ' : ''}.pf-svc-grid { grid-template-columns: 1fr; }
}

/* ===== Page-builder grid (sections → 12-col rows → columns → widgets) ===== */
${s}.pf-section.is-full > .pf-container { max-width: none; }
${s}.pf-row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 28px 36px; align-items: start; }
${s}.pf-row + .pf-row { margin-top: 28px; }
${s}.pf-row.is-auto { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
${s}.pf-row.is-auto > .pf-col { grid-column: auto !important; }
${s}.pf-col { min-width: 0; }
${s}.pf-section.bg-accent, ${scope ? scope + ' ' : ''}.pf-section.bg-dark { color: #fff; }
${s}.pf-section.bg-accent .pf-w-heading, ${scope ? scope + ' ' : ''}.pf-section.bg-dark .pf-w-heading { color: #fff; }
${s}.pf-section.bg-accent .pf-w-text, ${scope ? scope + ' ' : ''}.pf-section.bg-dark .pf-w-text { color: rgba(255,255,255,0.88); }
${s}.pf-section.bg-accent .pf-btn { background: #fff; color: var(--accent) !important; }

/* Widgets */
${s}.pf-w-heading { font-family: var(--font); font-weight: 700; letter-spacing: -0.02em; margin: 0 0 16px; color: var(--text); }
${s}h1.pf-w-heading { font-size: clamp(40px, 7vw, 80px); line-height: 1.0; text-transform: uppercase; }
${s}h2.pf-w-heading { font-size: clamp(28px, 4vw, 38px); }
${s}h3.pf-w-heading { font-size: 20px; margin-bottom: 10px; }
${s}.pf-w-text { color: var(--muted); font-size: 16px; margin: 0 0 14px; }
${s}.pf-w-text p { margin: 0 0 10px; }
${s}.pf-w-image { display: block; max-width: 100%; height: auto; box-shadow: var(--shadow); }
${s}.pf-w-image.shape-square { border-radius: 4px; }
${s}.pf-w-image.shape-rounded { border-radius: 18px; }
${s}.pf-w-image.shape-circle { border-radius: 50%; aspect-ratio: 1 / 1; object-fit: cover; }
/* "Show full": display the whole image as-is, no crop. Drops the forced square
   crop on circles too (so a wide image isn't sliced into a disc). */
${s}.pf-w-image.fit-contain { aspect-ratio: auto; object-fit: contain; }
${s}.pf-w-image.shape-circle.fit-contain { border-radius: 12px; }
${s}.pf-w-image-wrap { display: block; }
${s}.pf-w-image-wrap.pf-align-center { text-align: center; }
${s}.pf-w-image-wrap.pf-align-center .pf-w-image { margin-left: auto; margin-right: auto; }
${s}.pf-w-image-wrap.pf-align-right { text-align: right; }
${s}.pf-w-image-wrap.pf-align-right .pf-w-image { margin-left: auto; }
${s}.pf-w-btn-wrap { margin: 6px 0 14px; }
${s}.pf-align-center { text-align: center; }
${s}.pf-align-center.pf-w-image, ${scope ? scope + ' ' : ''}.pf-align-center .pf-w-image { margin-left: auto; margin-right: auto; }
${s}.pf-align-center.pf-w-btn-wrap, ${scope ? scope + ' ' : ''}.pf-w-btn-wrap.pf-align-center { text-align: center; }
${s}.pf-align-right { text-align: right; }
${s}.pf-w-icon { font-size: 40px; color: var(--accent); margin-bottom: 10px; }
${s}.pf-w-spacer { width: 100%; }
${s}.pf-w-video { position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); }
${s}.pf-w-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
${s}.pf-w-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
${s}.pf-g-item { margin: 0; border-radius: 10px; overflow: hidden; background: var(--card); border: 1px solid var(--border); }
${s}.pf-g-item img { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
${s}.pf-g-item figcaption { padding: 8px; font-size: 13px; text-align: center; color: var(--muted); }
${s}.pf-contact-block .pf-contact-cols { color: inherit; }

@media (max-width: 760px) {
  ${s}.pf-row { grid-template-columns: 1fr; gap: 28px; }
  ${s}.pf-col { grid-column: 1 / -1 !important; }
}
${designCss(scope)}
${pageBgCss}`
}

// Per-design visual overrides, layered on top of the shared styles above. Each
// block is gated on [data-design="…"] which lives on the same element as
// [data-theme] (the export root, or .cv-canvas / .pf-preview in the app), so the
// selectors mirror how the theme rules are scoped. Only properties that differ
// from the base are set — everything else falls through to the shared CSS.
function designCss(scope: string): string {
  // Root-level token overrides (for var() values). For the export these go on
  // :root[data-design]; in-app they go on the scope element itself.
  const at = (id: string) =>
    scope ? `${scope}[data-design="${id}"]` : `:root[data-design="${id}"]`
  // Root-level override gated on a specific theme — use this for any token that
  // assumes light/dark (e.g. a dark panel colour), so a design that ships dark
  // doesn't paint dark panels under a light theme (and vice-versa). Without this
  // gate, a dark --soft under a light theme yields dark text on a dark panel.
  const atTheme = (id: string, theme: 'light' | 'dark') => {
    const base = scope ? scope : ':root'
    return `${base}[data-theme="${theme}"][data-design="${id}"]`
  }
  // Descendant rule prefix for a given design.
  const on = (id: string) => (scope ? `${scope}[data-design="${id}"] ` : `[data-design="${id}"] `)

  return `
/* ===================== Designs ===================== */

/* —— Minimal: quiet, roomy, hairline rules, no chrome —— */
${at('minimal')} { --shadow: 0 1px 0 var(--border); }
${on('minimal')}.pf-w-heading, ${on('minimal')}.pf-heading { letter-spacing: -0.01em; }
${on('minimal')}h1.pf-w-heading { text-transform: none; font-weight: 600; }
${on('minimal')}.pf-hero { background: none; }
${on('minimal')}.pf-hero-mark { display: none; }
${on('minimal')}.pf-card { box-shadow: none; border-radius: 8px; }
${on('minimal')}.pf-card:hover { transform: none; box-shadow: 0 6px 20px rgba(20,22,28,0.08); }
${on('minimal')}.pf-btn { background: none; color: var(--accent) !important; border: 1px solid var(--accent); box-shadow: none; }
${on('minimal')}.pf-btn:hover { background: var(--accent); color: #fff !important; transform: none; }
${on('minimal')}.pf-tags li { background: none; border: 1px solid var(--border); color: var(--text); }
${on('minimal')}.pf-skill-fill { background: var(--text); }
${on('minimal')}.pf-section { padding: 84px 0; }

/* —— Studio: agency cards, soft panels, strong section titles —— */
${on('studio')}.pf-section-title, ${on('studio')}.pf-heading { font-size: 30px; text-transform: none; letter-spacing: -0.01em; color: var(--text); }
${on('studio')}.pf-heading { text-align: left; }
${on('studio')}.pf-card { border-radius: 18px; box-shadow: 0 14px 36px rgba(20,22,28,0.10); }
${on('studio')}.pf-w-image, ${on('studio')}.pf-pf-item { border-radius: 16px; }
${on('studio')}.pf-svc-icon { border-radius: 16px; width: 60px; height: 60px; }
${on('studio')}.pf-hero-mark { opacity: 0.04; }
${on('studio')}.pf-btn { border-radius: 12px; }

/* —— Bold: oversized type, accent-flooded hero, high contrast —— */
${on('bold')}h1.pf-w-heading, ${on('bold')}.pf-hero-name { font-size: clamp(52px, 11vw, 120px); line-height: 0.92; letter-spacing: -0.03em; }
${on('bold')}.pf-hero { background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #000)); }
${on('bold')}.pf-hero *, ${on('bold')}.pf-hero .pf-dot { color: #fff !important; }
${on('bold')}.pf-hero-mark { color: #fff; opacity: 0.12; }
${on('bold')}.pf-section-title, ${on('bold')}.pf-heading { font-size: 13px; }
${on('bold')}.pf-btn { border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
${on('bold')}.pf-card { border-radius: 4px; }
${on('bold')}.pf-svc-icon { border-radius: 4px; }

/* —— Editorial: serif, centered, magazine rhythm —— */
${at('editorial')} { --font: Georgia, 'Times New Roman', serif; }
${on('editorial')}.pf-w-text, ${on('editorial')}.pf-rich, ${on('editorial')}.pf-hero-intro { font-size: 18px; line-height: 1.8; }
${on('editorial')}.pf-section-title, ${on('editorial')}.pf-heading { text-align: center; text-transform: uppercase; letter-spacing: 0.18em; font-size: 13px; font-weight: 600; }
${on('editorial')}h1.pf-w-heading, ${on('editorial')}.pf-hero-name { text-transform: none; font-weight: 700; letter-spacing: -0.01em; }
${on('editorial')}.pf-hero { text-align: center; }
${on('editorial')}.pf-hero-inner { align-items: center; }
${on('editorial')}.pf-hero-mark { display: none; }
${on('editorial')}.pf-card { box-shadow: none; border: 1px solid var(--border); border-radius: 2px; }
${on('editorial')}.pf-btn { border-radius: 2px; background: var(--text); }
${on('editorial')}.pf-tags li { border-radius: 2px; }

/* —— Developer: terminal-flavoured, mono accents, tagged headings —— */
/* Dark-panel tokens only under the dark theme, so a light-theme developer page
   keeps readable (light) panels instead of dark-on-dark text. */
${atTheme('developer', 'dark')} { --soft: #11161c; }
${on('developer')}.pf-section-title, ${on('developer')}.pf-heading { font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace; text-transform: none; letter-spacing: 0; color: var(--text); }
${on('developer')}.pf-section-title::before, ${on('developer')}.pf-heading::before { content: '// '; color: var(--accent); }
${on('developer')}.pf-heading { text-align: left; }
${on('developer')}.pf-hero-name, ${on('developer')}h1.pf-w-heading { font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace; text-transform: none; letter-spacing: -0.02em; }
${on('developer')}.pf-hero-mark { font-family: ui-monospace, monospace; }
${on('developer')}.pf-card { border-radius: 8px; border-color: color-mix(in srgb, var(--accent) 30%, var(--border)); box-shadow: none; }
${on('developer')}.pf-card:hover { box-shadow: 0 0 0 1px var(--accent); transform: none; }
${on('developer')}.pf-tags li, ${on('developer')}.pf-svc-icon { font-family: ui-monospace, monospace; border-radius: 6px; }
${on('developer')}.pf-btn { border-radius: 6px; font-family: ui-monospace, monospace; box-shadow: none; }
${on('developer')}.pf-skill-track { background: color-mix(in srgb, var(--text) 14%, var(--bg)); }
/* Skill labels/percentages always track the body text colour for contrast. */
${on('developer')}.pf-skill-head { color: var(--text); }

/* —— Corporate: structured, banded hero, trustworthy —— */
${on('corporate')}.pf-hero { background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 10%, var(--bg)), var(--bg)); text-align: left; border-bottom: 3px solid var(--accent); }
${on('corporate')}.pf-hero-inner { align-items: flex-start; }
${on('corporate')}.pf-hero-name, ${on('corporate')}h1.pf-w-heading { text-transform: none; font-weight: 700; letter-spacing: -0.01em; font-size: clamp(36px, 6vw, 58px); }
${on('corporate')}.pf-hero-mark { display: none; }
${on('corporate')}.pf-section-title, ${on('corporate')}.pf-heading { text-transform: uppercase; letter-spacing: 0.1em; font-size: 13px; color: var(--accent); text-align: left; padding-left: 12px; border-left: 3px solid var(--accent); }
${on('corporate')}.pf-heading { margin-bottom: 28px; }
${on('corporate')}.pf-card { border-radius: 8px; box-shadow: 0 6px 18px rgba(20,22,28,0.06); border-top: 3px solid var(--accent); }
${on('corporate')}.pf-svc-icon { border-radius: 8px; background: var(--accent); color: #fff; }
${on('corporate')}.pf-btn { border-radius: 6px; box-shadow: none; }
${on('corporate')}.pf-tags li { border-radius: 6px; }

/* —— Academia: formal, serif, ruled headings, record lists —— */
${at('academia')} { --font: Georgia, 'Times New Roman', serif; }
${on('academia')}.pf-hero { text-align: center; border-bottom: 2px solid var(--text); padding-bottom: 48px; }
${on('academia')}.pf-hero-inner { align-items: center; }
${on('academia')}.pf-hero-mark { display: none; }
${on('academia')}.pf-hero-name, ${on('academia')}h1.pf-w-heading { text-transform: none; font-weight: 700; letter-spacing: 0.01em; }
${on('academia')}.pf-hero-eyebrow { font-variant: small-caps; letter-spacing: 0.1em; }
${on('academia')}.pf-section-title, ${on('academia')}.pf-heading { text-align: center; font-family: var(--font); text-transform: none; letter-spacing: 0.02em; font-size: 26px; color: var(--text); font-weight: 700; }
${on('academia')}.pf-heading::after { content: ''; display: block; width: 56px; height: 2px; background: var(--accent); margin: 12px auto 0; }
${on('academia')}.pf-card { box-shadow: none; border: 1px solid var(--border); border-radius: 2px; }
${on('academia')}.pf-btn { border-radius: 2px; background: var(--accent); box-shadow: none; }
${on('academia')}.pf-tags li { background: none; border: 1px solid var(--accent); color: var(--accent); border-radius: 2px; }
${on('academia')}.pf-skill-fill { background: var(--accent); }

/* —— Gallery: image-first, edge-to-edge work grid, dramatic dark canvas —— */
${atTheme('gallery', 'dark')} { --soft: #050505; --bg: #0a0a0a; --border: #1d1d1d; --card: #121212; }
${on('gallery')}.pf-hero { text-align: center; }
${on('gallery')}.pf-hero-inner { align-items: center; }
${on('gallery')}.pf-hero-name, ${on('gallery')}h1.pf-w-heading { font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: clamp(44px, 9vw, 96px); }
${on('gallery')}.pf-hero-mark { opacity: 0.07; }
${on('gallery')}.pf-section-title, ${on('gallery')}.pf-heading { text-align: center; text-transform: uppercase; letter-spacing: 0.22em; font-size: 12px; color: var(--muted); }
${on('gallery')}.pf-pf-grid { gap: 4px; grid-template-columns: repeat(3, 1fr); }
${on('gallery')}.pf-pf-item { border: none; border-radius: 0; }
${on('gallery')}.pf-pf-item figcaption { background: rgba(0,0,0,0.5); }
${on('gallery')}.pf-pf-item img { transition: transform 0.5s ease, filter 0.5s ease; filter: grayscale(0.2); }
${on('gallery')}.pf-pf-item:hover img { transform: scale(1.05); filter: grayscale(0); }
${on('gallery')}.pf-w-image, ${on('gallery')}.pf-g-item { border-radius: 0; }
${on('gallery')}.pf-btn { border-radius: 0; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: none; }
${on('gallery')}.pf-card { border-radius: 0; box-shadow: none; }
`
}
