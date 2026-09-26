import { highlightXml, HL_CLASS } from '@/lib/saml/highlight';
import { cn } from '@/lib/cn';

/** Renders an XML string verbatim with syntax highlighting (no reformatting). */
export function CodeXml({ src, className }: { src: string; className?: string }) {
  const tokens = highlightXml(src);
  return (
    <pre className={cn('overflow-auto whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.6]', className)}>
      <code>
        {tokens.map((tok, i) => (
          <span key={i} className={HL_CLASS[tok.k]}>
            {tok.t}
          </span>
        ))}
      </code>
    </pre>
  );
}
