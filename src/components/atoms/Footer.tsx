import { GithubIcon, LinkedInIcon, MailIcon, HeartIcon, CoffeeIcon } from './icons'

const PORTFOLIO_URL = 'https://rajmaharjan2002.com.np/'
const GITHUB_URL = 'https://github.com/RajMaharjan8/'
const LINKEDIN_URL = 'https://www.linkedin.com/in/raj-maharjan-a408b7229/' 
const EMAIL = 'mailto:hello@rajmaharjan2002.com.np' 

export default function Footer() {
  return (
    <footer className="app-footer">
      <a className="app-footer-brand" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
        Raj<span className="app-footer-dot">.</span>
      </a>

      <span className="app-footer-credit">
        © 2026 — Built with <HeartIcon className="app-footer-heart" /> by{' '}
        <a className="app-footer-credit-link" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
          Raj.
        </a>
      </span>

      <div className="app-footer-spacer" />

      <nav className="app-footer-social" aria-label="Social links">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <GithubIcon />
        </a>
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <LinkedInIcon />
        </a>
        <a href={EMAIL} aria-label="Email">
          <MailIcon />
        </a>
      </nav>

      <span className="app-footer-tagline">
        Crafted with <CoffeeIcon className="app-footer-coffee" />
      </span>
    </footer>
  )
}
