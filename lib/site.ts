// Central site metadata.
export const site = {
  name: 'samlsec',
  // Live at the GitHub Pages project-site URL. If a custom domain (e.g.
  // samlsec.io) is ever wired up, update this — and note that changes
  // upstream (sitemap, canonical URLs, OG images) all flow from it.
  url: 'https://inzelsec.github.io/samlsec',
  description:
    'The offensive, educational counterpart to samltool.com. Decode, inspect, and understand SAML — see what a signature actually covers, entirely in your browser.',
  author: 'Alex Insel',
  github: 'https://github.com/InzelSec/samlsec',
  githubProfile: 'https://github.com/InzelSec',
  social: 'https://x.com/alexinsel',
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Short hint used in the mobile menu / tooltips. */
  hint: string;
}

export const NAV: NavItem[] = [
  { href: '/viewer/', label: 'Viewer', hint: 'Full-screen, byte-exact XML viewer' },
  { href: '/decoder/', label: 'Decoder', hint: 'Decode a SAMLResponse automatically' },
  { href: '/encoder/', label: 'Encoder', hint: 'Encode XML into both SAML bindings' },
  { href: '/attacks/', label: 'Attacks', hint: 'XSW & signature exclusion — like SAML Raider' },
  { href: '/differential/', label: 'Differential', hint: 'How parsers disagree' },
  { href: '/cves/', label: 'CVEs', hint: 'The SAML CVE database' },
  { href: '/learn/', label: 'Learn', hint: 'Guides & curated reading' },
  { href: '/checklist/', label: 'Checklist', hint: 'Pentest checklist' },
];
