/**
 * Texto das citações do fichamento.
 *
 * Cada citação continua sendo uma string, com uma marcação mínima no estilo Markdown:
 *   *itálico*, **negrito** e ***os dois***; \* e \_ são caracteres literais.
 *   ___ (três ou mais sublinhados) marca a virada de página: sozinho numa linha, ou entre
 *   espaços no meio do texto. Na tela vira uma linha discreta; no texto copiado, exportado
 *   ou impresso ela some (a linha da marca sai inteira; no meio do texto fica um espaço).
 *
 * Colar guarda só o texto, o itálico e o negrito; copiar entrega o mesmo, sem a marca.
 * Tudo aqui é puro (sem DOM real), para ser testado no Node.
 */

export interface QuoteSpan {
  kind: 'text';
  text: string;
  italic: boolean;
  bold: boolean;
}

/** Virada de página. `join` é o que ela vira no texto copiado: nada, um espaço ou a quebra de linha. */
export interface QuoteBreak {
  kind: 'break';
  type: 'linha' | 'inline';
  join: '' | ' ' | '\n';
}

export type QuoteNode = QuoteSpan | QuoteBreak;

const BREAK_LINE = /^[ \t]*_{3,}[ \t]*$/;
const INLINE_BREAK = /[ \t]*(?<![^ \t])_{3,}(?![^ \t])[ \t]*/;
const ESCAPED_STAR = '\uE000';
const ESCAPED_UNDERSCORE = '\uE001';

const span = (text: string, italic = false, bold = false): QuoteSpan => ({ kind: 'text', text, italic, bold });
const isText = (node: QuoteNode | undefined): node is QuoteSpan => node?.kind === 'text';

interface Token {
  text: string;      // literal text; for a run of "*", empty until the unmatched stars are put back
  stars: number;     // stars still unmatched in this run (0 for text)
  canOpen: boolean;
  canClose: boolean;
  italic: boolean;
  bold: boolean;
}

/**
 * Italic and bold of one line, by the Markdown rule for runs of "*": a run followed by a letter can
 * open, a run preceded by one can close, and each closer pairs with the nearest opener (two stars
 * for bold, one for italic). So "**um *rei***" and "*um **rei***" nest as expected.
 */
function parseEmphasis(text: string): QuoteSpan[] {
  const guarded = text.replace(/\\\*/g, ESCAPED_STAR).replace(/\\_/g, ESCAPED_UNDERSCORE);
  const restore = (value: string) => value.replace(/\uE000/g, '*').replace(/\uE001/g, '_');
  const tokens: Token[] = [];
  let position = 0;
  for (const piece of guarded.match(/\*+|[^*]+/g) || []) {
    const start = position;
    position += piece.length;
    if (piece[0] !== '*') {
      tokens.push({ text: piece, stars: 0, canOpen: false, canClose: false, italic: false, bold: false });
      continue;
    }
    const before = guarded[start - 1];
    const after = guarded[position];
    tokens.push({
      text: '',
      stars: piece.length,
      canOpen: after !== undefined && !/\s/.test(after),
      canClose: before !== undefined && !/\s/.test(before),
      italic: false,
      bold: false,
    });
  }

  const openers: number[] = [];
  tokens.forEach((token, index) => {
    if (!token.stars) return;
    if (token.canClose) {
      while (token.stars > 0) {
        let found = -1;
        for (let stack = openers.length - 1; stack >= 0; stack--) {
          if (tokens[openers[stack]].stars > 0) { found = stack; break; }
        }
        if (found < 0) break;
        const opener = tokens[openers[found]];
        const used = opener.stars >= 2 && token.stars >= 2 ? 2 : 1;
        for (let inner = openers[found] + 1; inner < index; inner++) {
          if (used === 2) tokens[inner].bold = true;
          else tokens[inner].italic = true;
        }
        opener.stars -= used;
        token.stars -= used;
        // Runs between the pair can no longer open anything beyond it.
        openers.length = opener.stars > 0 ? found + 1 : found;
      }
    }
    if (token.stars > 0 && token.canOpen) openers.push(index);
  });

  const spans: QuoteSpan[] = [];
  for (const token of tokens) {
    const value = restore(token.text + '*'.repeat(token.stars));
    if (!value) continue;
    const last = spans[spans.length - 1];
    if (last && last.italic === token.italic && last.bold === token.bold) last.text += value;
    else spans.push(span(value, token.italic, token.bold));
  }
  return spans;
}

function parseLine(line: string): QuoteNode[] {
  const nodes: QuoteNode[] = [];
  line.split(INLINE_BREAK).forEach((part, index) => {
    if (index > 0) nodes.push({ kind: 'break', type: 'inline', join: '' });
    if (part) nodes.push(...parseEmphasis(part));
  });
  // A mark between two words leaves one space; at the edge of the line, nothing.
  nodes.forEach((node, index) => {
    if (node.kind !== 'break' || !isText(nodes[index - 1])) return;
    if (nodes.slice(index + 1).some((other) => isText(other) && other.text)) node.join = ' ';
  });
  return nodes;
}

/** The quote as text runs and page turns, in reading order; text runs never span lines. */
export function parseQuote(text: string): QuoteNode[] {
  const out: QuoteNode[] = [];
  let pending: QuoteBreak[] = [];
  let seenTextLine = false;
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (BREAK_LINE.test(line)) {
      pending.push({ kind: 'break', type: 'linha', join: '' });
      continue;
    }
    // The line of a mark disappears: between two lines of text it stands for one line break.
    if (seenTextLine) {
      if (pending.length) pending[0].join = '\n';
      else out.push(span('\n'));
    }
    out.push(...pending, ...parseLine(line));
    pending = [];
    seenTextLine = true;
  }
  out.push(...pending);
  return out;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

function wrapHtml(node: QuoteSpan): string {
  let html = escapeHtml(node.text).replace(/\n/g, '<br>');
  if (!node.text.trim()) return html;
  if (node.italic) html = `<em>${html}</em>`;
  if (node.bold) html = `<strong>${html}</strong>`;
  return html;
}

/** Text without marks: what reaches the clipboard and the .txt export. */
export function quoteToPlainText(text: string): string {
  return parseQuote(text).map((node) => (node.kind === 'text' ? node.text : node.join)).join('');
}

/** HTML with only <em>, <strong> and <br>: the PDF export and rich paste targets. */
export function quoteToHtml(text: string): string {
  return parseQuote(text).map((node) => (node.kind === 'text' ? wrapHtml(node) : node.join === '\n' ? '<br>' : node.join)).join('');
}

function wrapMarkers(text: string, italic: boolean, bold: boolean): string {
  if (!italic && !bold) return text;
  const [, lead, core, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  if (!core) return text;
  const marker = italic && bold ? '***' : bold ? '**' : '*';
  return `${lead}${marker}${core}${marker}${trail}`;
}

const escapeMarkers = (text: string) => text.replace(/\*/g, '\\*').replace(/_{3,}/g, (run) => `\\${run}`);

/** Markdown export: emphasis kept, page turns gone. */
export function quoteToMarkdown(text: string): string {
  return parseQuote(text)
    .map((node) => (node.kind === 'text' ? wrapMarkers(escapeMarkers(node.text), node.italic, node.bold) : node.join))
    .join('');
}

/** Clipboard contents for copied quote text: clean text, and HTML that a later paste here turns back into marks. */
export function nodesToClipboard(nodes: QuoteNode[]): { plain: string; html: string } {
  const list = [...nodes];
  const blankText = (node: QuoteNode | undefined) => isText(node) && !node.text.trim();
  // Edges: no leading or trailing blank lines. Marks stay (a later paste here restores them), but only
  // a mark between two pieces of text turns into a space or a line break.
  while (list.length && blankText(list[0])) list.shift();
  while (list.length && blankText(list[list.length - 1])) list.pop();
  let firstText = -1;
  let lastText = -1;
  list.forEach((node, index) => {
    if (!isText(node)) return;
    if (firstText < 0) firstText = index;
    lastText = index;
  });
  const joinAt = (node: QuoteBreak, index: number) => (index > firstText && index < lastText ? node.join : '');
  const plain = list.map((node, index) => (node.kind === 'text' ? node.text : joinAt(node, index))).join('').trim();
  const html = list
    .map((node, index) => {
      if (node.kind === 'text') return wrapHtml(node);
      const join = joinAt(node, index);
      return `<span data-quebra="${node.type}">${join === '\n' ? '<br>' : join}</span>`;
    })
    .join('');
  return { plain, html };
}

// ---- Reading HTML (paste) and the page itself (copy) ----

/** The part of a DOM node used here; real DOM nodes fit it, and tests build small fakes. */
export interface MiniNode {
  nodeType: number;
  nodeName: string;
  nodeValue: string | null;
  childNodes: ArrayLike<MiniNode>;
  getAttribute?: (name: string) => string | null;
}

export interface TextFormat {
  italic: boolean;
  bold: boolean;
}

const SKIPPED = new Set(['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'META', 'LINK', 'NOSCRIPT', 'TEMPLATE', 'BUTTON', 'SVG', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'IMG', 'PICTURE', 'VIDEO', 'AUDIO', 'CANVAS', 'IFRAME', 'OBJECT']);
const BLOCKS = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'DL', 'DT', 'DD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'TABLE', 'TR', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE', 'NAV', 'MAIN', 'FIGURE', 'FIGCAPTION', 'ADDRESS', 'HR', 'FORM', 'FIELDSET']);
const ITALIC_TAGS = new Set(['I', 'EM', 'CITE', 'DFN']);
const BOLD_TAGS = new Set(['B', 'STRONG']);
const INVISIBLE = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g;

function styleOf(node: MiniNode): Record<string, string> {
  const style: Record<string, string> = {};
  for (const declaration of (node.getAttribute?.('style') || '').split(';')) {
    const colon = declaration.indexOf(':');
    if (colon > 0) style[declaration.slice(0, colon).trim().toLowerCase()] = declaration.slice(colon + 1).trim().toLowerCase();
  }
  return style;
}

/** Italic and bold of an element: its tag, overridden by its own style (Google Docs wraps text in <b style="font-weight:normal">). */
export function formatOf(node: MiniNode, inherited: TextFormat): TextFormat {
  const tag = node.nodeName.toUpperCase();
  let { italic, bold } = inherited;
  if (ITALIC_TAGS.has(tag)) italic = true;
  if (BOLD_TAGS.has(tag)) bold = true;
  const style = styleOf(node);
  if (style['font-style']) italic = /italic|oblique/.test(style['font-style']);
  if (style['font-weight']) {
    const weight = style['font-weight'].replace(/\s*!important$/, '');
    bold = weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
  }
  return { italic, bold };
}

/**
 * Text runs, line breaks and page turns found in HTML or in a copied part of the page.
 * `paste` collapses whitespace as HTML does; `copy` keeps it, since the quotes are shown with their line breaks.
 */
export function readNodes(root: MiniNode, mode: 'paste' | 'copy', inherited: TextFormat = { italic: false, bold: false }): QuoteNode[] {
  const out: QuoteNode[] = [];
  const endsLine = () => {
    const last = out[out.length - 1];
    return !last || (isText(last) && last.text.endsWith('\n')) || (last.kind === 'break' && last.join === '\n');
  };
  const newline = () => { if (!endsLine()) out.push(span('\n')); };

  const visit = (node: MiniNode, format: TextFormat) => {
    if (node.nodeType === 3) {
      let text = (node.nodeValue || '').replace(INVISIBLE, '');
      if (mode === 'paste') text = text.replace(/[\s\u00A0]+/g, ' ');
      if (text) out.push(span(text, format.italic, format.bold));
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
    const tag = node.nodeName.toUpperCase();
    if (node.nodeType === 1) {
      if (SKIPPED.has(tag)) return;
      const style = styleOf(node);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const pageBreak = node.getAttribute?.('data-quebra');
      if (pageBreak) {
        const type = pageBreak === 'inline' ? 'inline' : 'linha';
        const join = (node.getAttribute?.('data-junta') ?? '') as QuoteBreak['join'];
        out.push({ kind: 'break', type, join: join === ' ' || join === '\n' ? join : '' });
        return;
      }
      if (tag === 'BR') { out.push(span('\n')); return; }
    }
    const block = BLOCKS.has(tag);
    if (block) newline();
    const inner = node.nodeType === 1 ? formatOf(node, format) : format;
    for (let index = 0; index < node.childNodes.length; index++) visit(node.childNodes[index], inner);
    if (block) newline();
    else if (tag === 'TD' || tag === 'TH') out.push(span(' '));
  };

  visit(root, inherited);
  return out;
}

/** What a paste inserts in the quote field: the text with marks for italic, bold and page turns. */
export function nodesToSource(nodes: QuoteNode[]): string {
  // Neighbouring runs with the same look become one, so the marks wrap whole words and phrases.
  const merged: QuoteNode[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (isText(node) && isText(last) && !node.text.includes('\n') && !last.text.includes('\n') && node.italic === last.italic && node.bold === last.bold) {
      merged[merged.length - 1] = { ...last, text: last.text + node.text };
    } else {
      merged.push(node);
    }
  }
  let source = '';
  for (const node of merged) {
    if (node.kind === 'break') {
      if (node.type === 'inline') source += ' ___ ';
      else source += `${source && !source.endsWith('\n') ? '\n' : ''}___\n`;
      continue;
    }
    // A line break right after a page turn on its own line is the one the turn already stands for.
    if (node.text === '\n' && source.endsWith('___\n')) continue;
    source += node.text
      .split('\n')
      .map((line) => wrapMarkers(escapeMarkers(line), node.italic, node.bold))
      .join('\n');
  }
  return source
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A paste with no formatting: the text as it came, with literal "*" and "___" kept literal. */
export function plainToSource(text: string): string {
  return escapeMarkers(text.replace(/\r\n?/g, '\n').replace(INVISIBLE, ''));
}

// ---- Ctrl+I / Ctrl+B in the quote field ----

export interface MarkerEdit {
  from: number;
  to: number;
  insert: string;
  selectStart: number;
  selectEnd: number;
}

const starsBefore = (value: string, index: number) => { let count = 0; while (index - count > 0 && value[index - count - 1] === '*') count++; return count; };
const starsAfter = (value: string, index: number) => { let count = 0; while (value[index + count] === '*') count++; return count; };

/** Turns italic or bold on or off around the selection, keeping the selected words selected. */
export function markerEdit(value: string, start: number, end: number, kind: 'italic' | 'bold'): MarkerEdit {
  const size = kind === 'bold' ? 2 : 1;
  const stars = Math.min(starsBefore(value, start), starsAfter(value, end));
  const active = kind === 'bold' ? stars >= 2 : stars === 1 || stars >= 3;
  const selected = value.slice(start, end);
  if (active) {
    const from = start - size;
    return { from, to: end + size, insert: selected, selectStart: from, selectEnd: from + selected.length };
  }
  const [, lead, core, trail] = selected.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  // The selection may include the marks themselves ("*palavra*" selected whole).
  const inner = Math.min(starsAfter(core, 0), starsBefore(core, core.length));
  const innerActive = core.length > inner * 2 && (kind === 'bold' ? inner >= 2 : inner === 1 || inner >= 3);
  if (innerActive) {
    const unwrapped = core.slice(size, core.length - size);
    const selectStart = start + lead.length;
    return { from: start, to: end, insert: `${lead}${unwrapped}${trail}`, selectStart, selectEnd: selectStart + unwrapped.length };
  }
  const marker = '*'.repeat(size);
  const selectStart = start + lead.length + size;
  return { from: start, to: end, insert: `${lead}${marker}${core}${marker}${trail}`, selectStart, selectEnd: selectStart + core.length };
}
