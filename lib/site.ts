// Central site metadata. Placeholders marked TODO should be confirmed before
// the first public deploy.
export const site = {
  name: 'samlsec',
  // TODO: confirm the final domain before deploy (candidates in the spec).
  url: 'https://samlsec.io',
  description:
    'The offensive, educational counterpart to samltool.com. Decode, inspect, and understand SAML — see what a signature actually covers, entirely in your browser.',
  author: 'Alex Insel',
  // TODO: confirm these before deploy.
  github: 'https://github.com/alexinsel/samlsec',
  githubProfile: 'https://github.com/alexinsel',
  social: 'https://x.com/alexinsel',
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Short hint used in the mobile menu / tooltips. */
  hint: string;
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Decoder', hint: 'Decode & encode a SAMLResponse' },
  { href: '/tools/attack-generator/', label: 'Attacks', hint: 'XSW & signature exclusion — like SAML Raider' },
  { href: '/tools/', label: 'Tools', hint: 'Encode, decode, transform' },
  { href: '/differential/', label: 'Differential', hint: 'How parsers disagree' },
  { href: '/cves/', label: 'CVEs', hint: 'The SAML CVE database' },
  { href: '/learn/', label: 'Learn', hint: 'Guides & curated reading' },
  { href: '/checklist/', label: 'Checklist', hint: 'Pentest checklist' },
];
