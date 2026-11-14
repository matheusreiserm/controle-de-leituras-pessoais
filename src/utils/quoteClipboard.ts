import type React from 'react';
import {
  formatOf,
  markerEdit,
  nodesToClipboard,
  nodesToSource,
  parseQuote,
  plainToSource,
  readNodes,
  type MiniNode,
  type QuoteNode,
  type TextFormat,
} from './quoteText';

/** Replaces the selection of a controlled textarea, keeping the browser's undo history when it can. */
function replaceSelection(field: HTMLTextAreaElement, text: string) {
  field.focus();
  let done = false;
  try {
    done = text ? document.execCommand('insertText', false, text) : document.execCommand('delete');
  } catch {
    done = false;
  }
  if (done) return;
  const { selectionStart: start, selectionEnd: end, value } = field;
  const next = value.slice(0, start) + text + value.slice(end);
  // Through the native setter, so React's onChange sees the change.
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(field, next);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.setSelectionRange(start + text.length, start + text.length);
}

/** Paste into a quote: only the text, its italic and bold, and page turns copied from another quote. */
export function pasteIntoQuote(event: React.ClipboardEvent<HTMLTextAreaElement>) {
  const data = event.clipboardData;
  const html = data.getData('text/html');
  const plain = data.getData('text/plain');
  let text = '';
  if (html && typeof DOMParser !== 'undefined') {
    const page = new DOMParser().parseFromString(html, 'text/html');
    text = nodesToSource(readNodes(page.body as unknown as MiniNode, 'paste'));
  }
  if (!text.trim()) text = plain ? plainToSource(plain) : '';
  if (!text) return; // Images or files: nothing for a text field, leave it to the browser.
  event.preventDefault();
  replaceSelection(event.currentTarget, text);
}

function writeClipboard(event: React.ClipboardEvent, nodes: QuoteNode[]): boolean {
  const { plain, html } = nodesToClipboard(nodes);
  if (!plain) return false;
  event.clipboardData.setData('text/plain', plain);
  event.clipboardData.setData('text/html', html);
  event.preventDefault();
  return true;
}

/** Copy or cut inside the quote field: clean text out, marks kept for a paste back into a quote. */
export function copyFromQuoteField(event: React.ClipboardEvent<HTMLTextAreaElement>, cut: boolean) {
  const field = event.currentTarget;
  const { selectionStart: start, selectionEnd: end, value } = field;
  if (start === end) return;
  if (writeClipboard(event, parseQuote(value.slice(start, end))) && cut) replaceSelection(field, '');
}

function formatAround(node: Node, root: Node): TextFormat {
  const chain: Node[] = [];
  for (let current: Node | null = node.nodeType === 1 ? node : node.parentNode; current && current !== root; current = current.parentNode) {
    chain.unshift(current);
  }
  return chain.reduce<TextFormat>((format, element) => (element.nodeType === 1 ? formatOf(element as unknown as MiniNode, format) : format), { italic: false, bold: false });
}

/**
 * Copy from the quotes shown on screen (selected with the mouse): plain text with only italic and bold,
 * without the page-turn lines. Copies from inputs and textareas are left to their own handlers.
 */
export function copyShownQuotes(event: React.ClipboardEvent<HTMLElement>) {
  const target = event.target as Element | null;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return;
  const root = event.currentTarget;
  const nodes: QuoteNode[] = [];
  for (let index = 0; index < selection.rangeCount; index++) {
    const range = selection.getRangeAt(index);
    if (!root.contains(range.commonAncestorContainer)) return;
    nodes.push(...readNodes(range.cloneContents() as unknown as MiniNode, 'copy', formatAround(range.commonAncestorContainer, root)));
  }
  writeClipboard(event, nodes);
}

/** Ctrl+I and Ctrl+B in the quote field. */
export function quoteFieldShortcut(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
  const key = event.key.toLowerCase();
  if (key !== 'i' && key !== 'b') return;
  event.preventDefault();
  const field = event.currentTarget;
  const edit = markerEdit(field.value, field.selectionStart, field.selectionEnd, key === 'b' ? 'bold' : 'italic');
  field.setSelectionRange(edit.from, edit.to);
  replaceSelection(field, edit.insert);
  field.setSelectionRange(edit.selectStart, edit.selectEnd);
}
