'use client';

import { useEffect } from 'react';
import type { RenderLine, TokenKind } from '@/lib/saml/render';
import type { AnatomyRole } from '@/lib/saml/types';
import { cn } from '@/lib/cn';

const TOKEN_CLASS: Record<TokenKind, string> = {
  punct: 'syn-punct',
  tag: 'syn-tag',
  attr: 'syn-attr',
  value: 'syn-value',
  text: 'syn-text',
  comment: 'syn-comment',
};

const INDENT_CH = 2;

export function XmlView({
  lines,
  registerNode,
  hoveredRole,
  highlightedNodeId,
}: {
  lines: RenderLine[];
  registerNode: (nodeId: string, el: HTMLDivElement | null) => void;
  hoveredRole: AnatomyRole | null;
  highlightedNodeId: string | null;
}) {
  return (
    <code className="block font-mono text-[13px] leading-[1.65]">
      {lines.map((line) => (
        <Line
          key={line.key}
          line={line}
          registerNode={registerNode}
          hot={
            (hoveredRole != null && line.openRole === hoveredRole) ||
            (highlightedNodeId != null && line.openNodeId === highlightedNodeId)
          }
        />
      ))}
    </code>
  );
}

function Line({
  line,
  registerNode,
  hot,
}: {
  line: RenderLine;
  registerNode: (nodeId: string, el: HTMLDivElement | null) => void;
  hot: boolean;
}) {
  const { openNodeId } = line;

  useEffect(() => {
    if (!openNodeId) return;
    return () => registerNode(openNodeId, null);
  }, [openNodeId, registerNode]);

  return (
    <div
      ref={openNodeId ? (el) => registerNode(openNodeId, el) : undefined}
      data-node-id={openNodeId}
      className={cn(
        'whitespace-pre-wrap break-words px-3',
        line.coverage === 'signed' && 'cov-signed',
        line.coverage === 'unsigned' && 'cov-unsigned',
        hot && 'role-hot',
      )}
      style={{ paddingLeft: `calc(${line.indent * INDENT_CH}ch + 0.75rem)` }}
    >
      {line.tokens.map((tok, i) => (
        <span key={i} className={TOKEN_CLASS[tok.k]}>
          {tok.t}
        </span>
      ))}
    </div>
  );
}
