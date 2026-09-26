'use client';

export interface Segment {
  id: string;
  /** y of the reference endpoint (content coordinates). */
  y1: number;
  /** y of the covered-element endpoint (content coordinates). */
  y2: number;
}

/**
 * Draws the blueprint connector(s) from a ds:Reference to the element it covers,
 * in a reserved left gutter. Purely presentational — geometry is measured by the
 * Decoder and passed in.
 */
export function Connectors({ segments, width, height }: { segments: Segment[]; width: number; height: number }) {
  if (segments.length === 0 || height === 0) return null;
  const rightX = width - 2;
  const bowX = 6;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width}
      height={height}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      {segments.map((s) => {
        const d = `M ${rightX} ${s.y1} C ${bowX} ${s.y1}, ${bowX} ${s.y2}, ${rightX} ${s.y2}`;
        return (
          <g key={s.id} style={{ color: 'var(--signed)' }}>
            <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} />
            <circle cx={rightX} cy={s.y1} r={2.5} fill="currentColor" />
            <circle cx={rightX} cy={s.y2} r={2.5} fill="currentColor" />
          </g>
        );
      })}
    </svg>
  );
}
