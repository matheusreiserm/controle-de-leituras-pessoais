import test from 'node:test';
import assert from 'node:assert/strict';
import {
  markerEdit,
  nodesToClipboard,
  nodesToSource,
  parseQuote,
  plainToSource,
  quoteToHtml,
  quoteToMarkdown,
  quoteToPlainText,
  readNodes,
  type MiniNode,
} from '../src/utils/quoteText';
import { formatFichamentoClipboardHtml, formatFichamentoHtml, formatFichamentoMarkdown, formatFichamentoText } from '../src/utils/fichamento';

// Small stand-ins for DOM nodes: enough for the readers, no browser needed.
const text = (value: string): MiniNode => ({ nodeType: 3, nodeName: '#text', nodeValue: value, childNodes: [] });
const el = (name: string, attrs: Record<string, string> | null, ...children: (MiniNode | string)[]): MiniNode => ({
  nodeType: 1,
  nodeName: name.toUpperCase(),
  nodeValue: null,
  childNodes: children.map((child) => (typeof child === 'string' ? text(child) : child)),
  getAttribute: (key) => attrs?.[key] ?? null,
});
const fragment = (...children: (MiniNode | string)[]): MiniNode => ({ ...el('#document-fragment', null, ...children), nodeType: 11 });

test('italic, bold and both are read from the marks; a lone or escaped star stays a star', () => {
  const nodes = parseQuote('um *grito* e **um nome** e ***os dois***; 2 * 3 e \\*literal\\*');
  assert.deepEqual(
    nodes.map((node) => node.kind === 'text' ? [node.text, node.italic, node.bold] : node.kind),
    [
      ['um ', false, false], ['grito', true, false], [' e ', false, false], ['um nome', false, true],
      [' e ', false, false], ['os dois', true, true], ['; 2 * 3 e *literal*', false, false],
    ]
  );
  assert.equal(quoteToPlainText('um *grito* e **um nome**'), 'um grito e um nome');
  assert.equal(quoteToHtml('um *grito* e **um <nome>**'), 'um <em>grito</em> e <strong>um &lt;nome&gt;</strong>');
});

test('marks nest as in Markdown: italic inside bold, bold inside italic, words joined to the marks', () => {
  const look = (source: string) => parseQuote(source).map((node) => node.kind === 'text' ? `${node.bold ? 'B' : ''}${node.italic ? 'I' : ''}[${node.text}]` : '|');
  assert.deepEqual(look('**um *rei***'), ['B[um ]', 'BI[rei]']);
  assert.deepEqual(look('*um **rei***'), ['I[um ]', 'BI[rei]']);
  assert.deepEqual(look('*a **b** c*'), ['I[a ]', 'BI[b]', 'I[ c]']);
  assert.deepEqual(look('***a** b*'), ['BI[a]', 'I[ b]']);
  assert.deepEqual(look('**a***b*'), ['B[a]', 'I[b]']);
  assert.deepEqual(look('*a***b**'), ['I[a]', 'B[b]']);
  assert.deepEqual(look('pala*vrinha*s'), ['[pala]', 'I[vrinha]', '[s]']);
  assert.deepEqual(look('sem fim **aqui e *ali'), ['[sem fim **aqui e *ali]']);
});

test('a page-turn line disappears from the copied text, as if it had never been typed', () => {
  assert.equal(quoteToPlainText('fim da página 45\n___\ncomeço da 46'), 'fim da página 45\ncomeço da 46');
  assert.equal(quoteToPlainText('verso um\n___\nverso dois\nverso três'), 'verso um\nverso dois\nverso três');
  assert.equal(quoteToPlainText('parágrafo.\n___\n\noutro'), 'parágrafo.\n\noutro');
  assert.equal(quoteToPlainText('___\ncomeça na página nova'), 'começa na página nova');
  assert.equal(quoteToPlainText('termina na página\n___'), 'termina na página');
  assert.equal(quoteToPlainText('a\n___\n_____\nb'), 'a\nb');
});

test('in the middle of a line the mark leaves one space, at its edges nothing', () => {
  assert.equal(quoteToPlainText('a frase vira ___ a página'), 'a frase vira a página');
  assert.equal(quoteToPlainText('vira a página ___\ne continua'), 'vira a página\ne continua');
  assert.equal(quoteToPlainText('a ___ ___ b'), 'a b');
  // Not a page turn: inside a word, escaped, or only two underscores.
  assert.equal(quoteToPlainText('nome_de_arquivo, a___b, \\___ e __'), 'nome_de_arquivo, a___b, ___ e __');
});

test('the page turn is drawn where it was written and carries what it becomes when copied', () => {
  const nodes = parseQuote('a *b*\n___\nc ___ d');
  assert.deepEqual(nodes.map((node) => node.kind === 'break' ? `[${node.type}:${JSON.stringify(node.join)}]` : node.text), ['a ', 'b', '[linha:"\\n"]', 'c', '[inline:" "]', 'd']);
});

test('exports keep italic and bold where the format allows and never show the mark', () => {
  const book = { title: 'Livro', author: 'Autora' };
  const items = [{ id: 'a', page: '45-46', text: 'o *mar* era\n___\n**escuro** 2*3' }];
  assert.match(formatFichamentoText(book, '', items), /\[45-46\]\no mar era\nescuro 2\*3\n\n$/);
  assert.match(formatFichamentoMarkdown(book, '', items), /## p\. 45-46\n\n> o \*mar\* era\n> \*\*escuro\*\* 2\\\*3\n\n$/);
  const html = formatFichamentoHtml(book, '', items);
  assert.match(html, /<blockquote>o <em>mar<\/em> era<br><strong>escuro<\/strong> 2\*3<\/blockquote>/);
  assert.doesNotMatch(html, /___/);
  const clip = formatFichamentoClipboardHtml(book, 'REF', items);
  assert.match(clip, /^FICHAMENTO: LIVRO<br>Autor: Autora<br>Referência: REF<br>/);
  assert.match(clip, /\[45-46\]<br>o <em>mar<\/em> era<br><strong>escuro<\/strong> 2\*3<br>$/);
});

test('a quote whose text is only the mark is not exported as an empty quote', () => {
  assert.doesNotMatch(formatFichamentoText({ title: 'L', author: 'A' }, '', [{ id: 'x', page: '3', text: '___' }]), /\[3\]/);
});

test('pasting from Google Docs keeps italic and bold, and drops its fake bold wrapper, fonts and colours', () => {
  const docs = el('body', null,
    el('meta', { charset: 'utf-8' }),
    el('b', { style: 'font-weight:normal;', id: 'docs-internal-guid-1' },
      el('p', { dir: 'ltr' },
        el('span', { style: 'font-size:11pt;font-family:Arial;color:#000000;font-weight:400;' }, 'Era '),
        el('span', { style: 'font-size:11pt;font-style:italic;font-weight:400;' }, 'uma vez'),
        el('span', { style: 'font-weight:700;' }, ' um rei'),
        el('span', { style: 'font-weight:400;' }, ' * sem par.'),
      ),
      el('p', { dir: 'ltr' }, el('span', { style: 'font-weight:700;font-style:italic' }, 'Fim'), '.'),
    ),
  );
  assert.equal(nodesToSource(readNodes(docs, 'paste')), 'Era *uma vez* **um rei** \\* sem par.\n***Fim***.');
});

test('pasting from Word or a web page: tags, inline styles, hidden text and line breaks', () => {
  const word = el('body', null,
    el('style', null, 'p.MsoNormal { color: red }'),
    el('p', { class: 'MsoNormal' }, 'Disse ', el('i', null, 'adeus'), ',', el('br', null), 'e ', el('b', { style: 'mso-bidi-font-weight:normal' }, 'partiu'), '.'),
    el('p', null, el('em', null, 'tudo ', el('span', { style: 'font-style:normal' }, 'menos'), ' isto')),
    el('div', { style: 'display:none' }, 'oculto'),
    el('p', null, 'um    texto\n  quebrado pelo HTML ', el('a', { href: 'x' }, 'link'), el('img', { src: 'x' })),
  );
  assert.equal(
    nodesToSource(readNodes(word, 'paste')),
    'Disse *adeus*,\ne **partiu**.\n*tudo* menos *isto*\num texto quebrado pelo HTML link'
  );
});

test('a plain-text paste keeps the text as typed, with literal stars and underscores', () => {
  const source = plainToSource('nota *1* e linha\r\n___\r\nfim');
  assert.equal(source, 'nota \\*1\\* e linha\n\\___\nfim');
  assert.equal(quoteToPlainText(source), 'nota *1* e linha\n___\nfim');
});

test('copying from the screen leaves out the page-turn line and keeps only italic and bold', () => {
  // What QuoteText draws for 'a *b*\n___\nc ___ d', inside the item card.
  const shown = fragment(
    el('li', { class: 'group rounded-xl' },
      el('div', { class: 'mb-1.5 flex' }, el('span', { class: 'font-mono' }, '#1'), ' ', el('span', { class: 'font-semibold' }, 'p. 45'), el('button', null, el('svg', null))),
      el('blockquote', { class: 'font-serif' },
        'a ', el('em', null, 'b'),
        el('span', { 'data-quebra': 'linha', 'data-junta': '\n' }),
        'c', el('span', { 'data-quebra': 'inline', 'data-junta': ' ' }), 'd',
      ),
    ),
  );
  const { plain, html } = nodesToClipboard(readNodes(shown, 'copy'));
  assert.equal(plain, '#1 p. 45\na b\nc d');
  assert.match(html, /a <em>b<\/em><span data-quebra="linha"><br><\/span>c<span data-quebra="inline"> <\/span>d/);
  assert.doesNotMatch(html, /class=|font-serif|svg|button/);
});

test('a word selected inside an italic passage is copied in italic', () => {
  const { html } = nodesToClipboard(readNodes(fragment('mar'), 'copy', { italic: true, bold: false }));
  assert.equal(html, '<em>mar</em>');
});

test('what is copied from a quote pastes back into a quote with its marks and page turns', () => {
  for (const source of ['o *mar* era\n___\n**escuro** e ***fundo***', 'vira ___ a página', 'parágrafo\n\nnovo *trecho*']) {
    const { html } = nodesToClipboard(parseQuote(source));
    // The browser parses the HTML: model it with the same nodes the HTML describes.
    const reparsed = nodesToSource(readNodes(htmlToNodes(html), 'paste'));
    assert.equal(reparsed, source, `round trip of ${JSON.stringify(source)}`);
  }
});

test('Ctrl+I and Ctrl+B wrap the selection, toggle off, and combine', () => {
  const apply = (value: string, start: number, end: number, kind: 'italic' | 'bold') => {
    const edit = markerEdit(value, start, end, kind);
    const next = value.slice(0, edit.from) + edit.insert + value.slice(edit.to);
    return { next, selected: next.slice(edit.selectStart, edit.selectEnd) };
  };
  assert.deepEqual(apply('um mar azul', 3, 6, 'italic'), { next: 'um *mar* azul', selected: 'mar' });
  assert.deepEqual(apply('um *mar* azul', 4, 7, 'italic'), { next: 'um mar azul', selected: 'mar' });
  assert.deepEqual(apply('um *mar* azul', 4, 7, 'bold'), { next: 'um ***mar*** azul', selected: 'mar' });
  assert.deepEqual(apply('um ***mar*** azul', 6, 9, 'bold'), { next: 'um *mar* azul', selected: 'mar' });
  assert.deepEqual(apply('um **mar** azul', 5, 8, 'italic'), { next: 'um ***mar*** azul', selected: 'mar' });
  // Spaces stay outside the marks; a selection that includes the marks toggles them off.
  assert.deepEqual(apply('um mar azul', 2, 7, 'bold'), { next: 'um **mar** azul', selected: 'mar' });
  assert.deepEqual(apply('um *mar* azul', 3, 8, 'italic'), { next: 'um mar azul', selected: 'mar' });
  assert.equal(apply('um ', 3, 3, 'italic').next, 'um **');
});

test('quotes saved before keep reading exactly as they did', () => {
  for (const old of ['Yo sabía que estábamos en guerra.', 'Primeira linha\nsegunda <linha>', 'Durante mucho tiempo creí.']) {
    assert.equal(quoteToPlainText(old), old);
    assert.equal(quoteToMarkdown(old), old);
  }
});

/** Minimal HTML reader for the round-trip test: only the tags nodesToClipboard writes. */
function htmlToNodes(html: string): MiniNode {
  const root = el('body', null);
  const stack: MiniNode[] = [root];
  const children = (node: MiniNode) => node.childNodes as MiniNode[];
  for (const token of html.match(/<[^>]+>|[^<]+/g) || []) {
    const parent = stack[stack.length - 1];
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const [, name, rest] = token.match(/^<(\w+)(.*?)>$/)!;
      const attrs: Record<string, string> = {};
      for (const [, key, value] of rest.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[key] = value;
      const node = el(name, attrs);
      children(parent).push(node);
      if (name.toLowerCase() !== 'br') stack.push(node);
      continue;
    }
    children(parent).push(text(token.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')));
  }
  return root;
}
