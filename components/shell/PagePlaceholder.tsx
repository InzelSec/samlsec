import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export function PagePlaceholder({
  title,
  lead,
  planned,
}: {
  title: string;
  lead: string;
  planned?: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge tone="blueprint">In progress</Badge>
      <h1 className="mt-4 text-title font-semibold text-ink">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">{lead}</p>

      {planned && planned.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">What lands here</h2>
          <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
            {planned.map((item) => (
              <li key={item} className="py-3 text-sm leading-relaxed text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 text-sm text-ink-soft">
        In the meantime, the{' '}
        <Link href="/decoder/" className="font-medium text-blueprint underline-offset-4 hover:underline">
          visual decoder
        </Link>{' '}
        is live.
      </p>
    </div>
  );
}
