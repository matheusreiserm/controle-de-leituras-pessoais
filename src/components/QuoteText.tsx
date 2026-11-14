import React, { useMemo } from 'react';
import { parseQuote } from '../utils/quoteText';

/**
 * A quote as shown: italic and bold applied, each ___ drawn as a faint line. The line has no text and
 * cannot be selected; the copy handler reads data-junta to put back a space or line break in its place.
 */
export function QuoteText({ text }: { text: string }) {
  const nodes = useMemo(() => parseQuote(text), [text]);
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === 'break') {
          return (
            <span
              key={index}
              data-quebra={node.type}
              data-junta={node.join}
              aria-hidden="true"
              title="Virada de página"
              className="my-2 block h-0 select-none border-t border-dashed border-amber-500/25 light:border-amber-400/35"
            />
          );
        }
        if (node.italic && node.bold) return <strong key={index}><em>{node.text}</em></strong>;
        if (node.bold) return <strong key={index}>{node.text}</strong>;
        if (node.italic) return <em key={index}>{node.text}</em>;
        return <React.Fragment key={index}>{node.text}</React.Fragment>;
      })}
    </>
  );
}
