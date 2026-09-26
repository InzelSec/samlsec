import type { AnatomyRole } from './types';
import { NODE, type XmlNode } from './anatomy';

export type TokenKind = 'punct' | 'tag' | 'attr' | 'value' | 'text' | 'comment';

export interface RenderToken {
  t: string;
  k: TokenKind;
}

export interface RenderLine {
  key: number;
  indent: number;
  tokens: RenderToken[];
  /** Set on the line that opens a significant element, to wire the overlay. */
  openNodeId?: string;
  openRole?: AnatomyRole;
  /** Coverage tint derived from the nearest enclosing Assertion. */
  coverage?: 'signed' | 'unsigned';
}

const INLINE_MAX = 240;

function qname(n: XmlNode): string {
  return n.nodeName || (n.prefix ? `${n.prefix}:${n.localName}` : n.localName || '');
}

function isElement(n: XmlNode) {
  return n.nodeType === NODE.ELEMENT;
}

function isWhitespaceText(n: XmlNode) {
  return n.nodeType === NODE.TEXT && !(n.nodeValue || '').trim();
}

function nameTokens(n: XmlNode): RenderToken[] {
  return [{ t: qname(n), k: 'tag' }];
}

function attrTokens(n: XmlNode): RenderToken[] {
  const out: RenderToken[] = [];
  const attrs = n.attributes;
  if (!attrs) return out;
  for (let i = 0; i < attrs.length; i++) {
    const a = attrs.item(i);
    if (!a) continue;
    out.push({ t: ' ', k: 'punct' });
    out.push({ t: a.nodeName, k: 'attr' });
    out.push({ t: '=', k: 'punct' });
    out.push({ t: `"${a.value}"`, k: 'value' });
  }
  return out;
}

/**
 * Serialize a DOM element into pretty-printed, tokenized lines. The output is
 * independent of the source formatting (we re-indent from the tree), which is
 * what lets the overlay reason about structure rather than whitespace.
 */
export function serialize(
  root: XmlNode,
  nodeIdOf: (el: XmlNode) => string | undefined,
  roleOf: (el: XmlNode) => AnatomyRole | undefined,
  assertionSigned: Map<string, boolean>,
): RenderLine[] {
  const lines: RenderLine[] = [];
  let key = 0;

  const push = (line: Omit<RenderLine, 'key'>) => {
    lines.push({ key: key++, ...line });
  };

  const walk = (el: XmlNode, depth: number, coverage: RenderLine['coverage']) => {
    const nodeId = nodeIdOf(el);
    const role = roleOf(el);

    let cov = coverage;
    if (role === 'assertion' && nodeId) {
      cov = assertionSigned.get(nodeId) ? 'signed' : 'unsigned';
    }

    const open: RenderToken[] = [{ t: '<', k: 'punct' }, ...nameTokens(el), ...attrTokens(el)];

    // Partition children.
    const kids = el.childNodes;
    const meaningful: XmlNode[] = [];
    for (let i = 0; i < kids.length; i++) {
      const c = kids.item(i);
      if (c && !isWhitespaceText(c)) meaningful.push(c);
    }

    const hasElementOrComment = meaningful.some(
      (c) => isElement(c) || c.nodeType === NODE.COMMENT,
    );
    const combinedText = meaningful
      .filter((c) => c.nodeType === NODE.TEXT || c.nodeType === NODE.CDATA)
      .map((c) => (c.nodeValue || '').trim())
      .join('');

    if (meaningful.length === 0) {
      // Self-closing.
      open.push({ t: '/>', k: 'punct' });
      push({ indent: depth, tokens: open, openNodeId: nodeId, openRole: role, coverage: cov });
      return;
    }

    if (!hasElementOrComment && combinedText.length <= INLINE_MAX && !combinedText.includes('\n')) {
      // Inline: <tag>text</tag>
      open.push({ t: '>', k: 'punct' });
      open.push({ t: combinedText, k: 'text' });
      open.push({ t: '</', k: 'punct' }, ...nameTokens(el), { t: '>', k: 'punct' });
      push({ indent: depth, tokens: open, openNodeId: nodeId, openRole: role, coverage: cov });
      return;
    }

    // Block form.
    open.push({ t: '>', k: 'punct' });
    push({ indent: depth, tokens: open, openNodeId: nodeId, openRole: role, coverage: cov });

    for (const c of meaningful) {
      if (isElement(c)) {
        walk(c, depth + 1, cov);
      } else if (c.nodeType === NODE.COMMENT) {
        push({
          indent: depth + 1,
          tokens: [{ t: `<!--${c.nodeValue || ''}-->`, k: 'comment' }],
          coverage: cov,
        });
      } else {
        const txt = (c.nodeValue || '').trim();
        if (txt) push({ indent: depth + 1, tokens: [{ t: txt, k: 'text' }], coverage: cov });
      }
    }

    push({
      indent: depth,
      tokens: [{ t: '</', k: 'punct' }, ...nameTokens(el), { t: '>', k: 'punct' }],
      coverage: cov,
    });
  };

  walk(root, 0, undefined);
  return lines;
}
