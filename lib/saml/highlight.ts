// A string-based XML tokenizer for DISPLAYING a payload verbatim. Unlike the
// decoder's DOM tokenizer (which re-indents), this preserves every byte — what
// you see is exactly what gets copied, which matters when a signature is over
// specific bytes.

export type HlKind = 'text' | 'tag' | 'attr' | 'value' | 'punct' | 'comment' | 'cdata' | 'decl';

export interface HlToken {
  t: string;
  k: HlKind;
}

export const HL_CLASS: Record<HlKind, string> = {
  text: 'syn-text',
  tag: 'syn-tag',
  attr: 'syn-attr',
  value: 'syn-value',
  punct: 'syn-punct',
  comment: 'syn-comment',
  cdata: 'syn-value',
  decl: 'syn-comment',
};

function tokenizeTag(tag: string, push: (t: string, k: HlKind) => void) {
  const j = tag.startsWith('</') ? 2 : 1;
  push(tag.slice(0, j), 'punct');
  const nameM = /^[^\s/>]+/.exec(tag.slice(j));
  let rest: string;
  if (nameM) {
    push(nameM[0], 'tag');
    rest = tag.slice(j + nameM[0].length);
  } else {
    rest = tag.slice(j);
  }
  const re = /(\s+)|([^\s=/>]+)(\s*=\s*)?("(?:[^"]*)"|'(?:[^']*)')?|(\/?\s*>)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    if (m[0] === '') {
      re.lastIndex++;
      continue;
    }
    if (m[1] != null) push(m[1], 'punct');
    else if (m[2] != null) {
      push(m[2], 'attr');
      if (m[3] != null) push(m[3], 'punct');
      if (m[4] != null) push(m[4], 'value');
    } else if (m[5] != null) push(m[5], 'punct');
    else if (m[6] != null) push(m[6], 'punct');
  }
}

export function highlightXml(src: string): HlToken[] {
  const toks: HlToken[] = [];
  const push = (t: string, k: HlKind) => {
    if (t) toks.push({ t, k });
  };
  const n = src.length;
  let i = 0;
  while (i < n) {
    if (src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i);
      const end = e < 0 ? n : e + 3;
      push(src.slice(i, end), 'comment');
      i = end;
    } else if (src.startsWith('<![CDATA[', i)) {
      const e = src.indexOf(']]>', i);
      const end = e < 0 ? n : e + 3;
      push(src.slice(i, end), 'cdata');
      i = end;
    } else if (src.startsWith('<?', i)) {
      const e = src.indexOf('?>', i);
      const end = e < 0 ? n : e + 2;
      push(src.slice(i, end), 'decl');
      i = end;
    } else if (src.startsWith('<!', i)) {
      const e = src.indexOf('>', i);
      const end = e < 0 ? n : e + 1;
      push(src.slice(i, end), 'decl');
      i = end;
    } else if (src[i] === '<') {
      const e = src.indexOf('>', i);
      const end = e < 0 ? n : e + 1;
      tokenizeTag(src.slice(i, end), push);
      i = end;
    } else {
      const lt = src.indexOf('<', i);
      const end = lt < 0 ? n : lt;
      push(src.slice(i, end), 'text');
      i = end;
    }
  }
  return toks;
}
