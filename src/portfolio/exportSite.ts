import JSZip from 'jszip'
import type { PortfolioData } from './types'
import { renderBodyInner } from './renderSite'
import { renderPageBody } from './canvas/renderPage'
import { siteCss } from './siteStyles'

// Prefer the new page-builder document; fall back to legacy blocks.
function bodyInner(data: PortfolioData): string {
  return data.page ? renderPageBody(data, data.page) : renderBodyInner(data)
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function buildHtml(data: PortfolioData): string {
  return `<!doctype html>
<html lang="en" data-theme="${data.settings.theme}" data-design="${data.settings.design ?? 'designer'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeAttr(data.settings.siteTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
${bodyInner(data)}
  <script src="script.js"></script>
</body>
</html>`
}

const SCRIPT_JS = `// Footer year, smooth-scroll nav, mobile menu + light/dark theme toggle.
document.addEventListener('DOMContentLoaded', function () {
  var y = document.getElementById('pf-year');
  if (y) y.textContent = new Date().getFullYear();

  var toggle = document.querySelector('.pf-nav-toggle');
  var links = document.querySelector('.pf-links');
  if (toggle && links) toggle.addEventListener('click', function () { links.classList.toggle('open'); });

  // Theme toggle (persists in localStorage).
  var saved = localStorage.getItem('pf-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  var themeBtn = document.querySelector('.pf-theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('pf-theme', cur);
  });

  document.querySelectorAll('.pf-links a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var el = document.querySelector(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); if (links) links.classList.remove('open'); }
      }
    });
  });

  // Reveal sections on scroll.
  var reveal = document.querySelectorAll('.pf-reveal');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveal.forEach(function (el) { obs.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add('in'); });
  }
});
`

// Build the three files and trigger a .zip download.
export async function downloadPortfolioZip(data: PortfolioData): Promise<void> {
  const zip = new JSZip()
  zip.file('index.html', buildHtml(data))
  zip.file('style.css', siteCss(data))
  zip.file('script.js', SCRIPT_JS)
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'portfolio.zip'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
