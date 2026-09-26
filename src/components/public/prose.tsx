import * as React from "react";

/**
 * Minimal renderer for the admin-editable legal content. Supports the small
 * subset used by the seeded documents: `##` headings, ordered/unordered list
 * items and `**bold**`. Everything is escaped by React, so admin-entered text
 * cannot inject markup.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${index}`} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
  });
}

export function LegalProse({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter((block) => block.trim().length > 0);
  let listCounter = 0;

  return (
    <div className="space-y-5">
      {blocks.map((block, blockIndex) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={blockIndex}
              className="text-xl font-semibold tracking-tight text-ink sm:text-2xl"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }

        const lines = trimmed.split("\n");
        const numbered = lines.every((line) => /^\d+\.\s/.test(line.trim()));
        if (numbered && lines.length > 1) {
          listCounter += 1;
          return (
            <ol key={blockIndex} className="space-y-3">
              {lines.map((line, lineIndex) => (
                <li
                  key={lineIndex}
                  className="flex gap-3 text-sm leading-relaxed text-muted"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-violet-500/28 bg-violet-500/10 font-mono text-[0.7rem] font-semibold text-violet-300">
                    {line.trim().match(/^(\d+)\./)?.[1]}
                  </span>
                  <span>
                    {renderInline(
                      line.trim().replace(/^\d+\.\s*/, ""),
                      `${listCounter}-${lineIndex}`,
                    )}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="text-sm leading-relaxed text-muted">
            {renderInline(trimmed.replace(/\n/g, " "), `p-${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}
