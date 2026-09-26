/**
 * A small chain-of-steps readout — "URL-decoded → Base64-decoded → Inflated" —
 * used anywhere the tool wants to disclose exactly which transformations it
 * applied automatically, rather than asserting it did the right thing.
 */
export function PipelineTrail({ steps, fallback }: { steps: string[]; fallback?: string }) {
  if (steps.length === 0) {
    return fallback ? <p className="text-xs leading-relaxed text-ink-soft">{fallback}</p> : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Steps applied automatically">
      {steps.map((step, i) => (
        <span key={step} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-soft/60" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span
            role="listitem"
            className="inline-flex items-center rounded border border-blueprint-soft/40 bg-[var(--blueprint-tint)] px-2 py-0.5 text-xs font-medium text-blueprint"
          >
            {step}
          </span>
        </span>
      ))}
    </div>
  );
}
