import Link from 'next/link';
import type { ReactNode } from 'react';

import { slugify } from '@/lib/blog/content';

type MarkdownBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'unordered'; items: string[] }
  | { type: 'ordered'; items: string[] };

function stableHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listType: 'unordered' | 'ordered' | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraph = [];
  };

  const flushList = () => {
    if (listType && listItems.length > 0) blocks.push({ type: listType, items: listItems });
    listItems = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: line.slice(2).trim() });
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== 'ordered') flushList();
      listType = 'ordered';
      listItems.push(orderedMatch[1]);
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      if (listType && listType !== 'unordered') flushList();
      listType = 'unordered';
      listItems.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const [, label, href] = match;
    const key = `link-${stableHash(`${label}-${href}-${match.index}`)}`;

    if (href.startsWith('/')) {
      nodes.push(
        <Link key={key} href={href} className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">
          {label}
        </Link>,
      );
    } else if (/^https?:\/\//.test(href)) {
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(label);
    }

    cursor = pattern.lastIndex;
    match = pattern.exec(text);
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function BlogArticleContent({ body }: { body: string }) {
  const blocks = parseMarkdown(body);

  return (
    <div className="space-y-6 text-[17px] leading-8 text-slate-700">
      {blocks.map((block) => {
        const blockText = 'text' in block ? block.text : block.items.join('|');
        const key = `${block.type}-${stableHash(blockText)}`;

        if (block.type === 'h2') {
          return (
            <h2
              key={key}
              id={slugify(block.text)}
              className="scroll-mt-28 pt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3 key={key} id={slugify(block.text)} className="scroll-mt-28 pt-3 text-xl font-bold text-slate-950">
              {block.text}
            </h3>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="rounded-r-2xl border-l-4 border-blue-600 bg-blue-50 px-6 py-5 font-medium text-slate-800">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === 'unordered' || block.type === 'ordered') {
          const List = block.type === 'unordered' ? 'ul' : 'ol';
          return (
            <List
              key={key}
              className={block.type === 'unordered' ? 'space-y-3 pl-6 marker:text-blue-700' : 'list-decimal space-y-3 pl-6 marker:font-bold marker:text-blue-700'}
            >
              {block.items.map((item) => (
                <li key={`${key}-${stableHash(item)}`}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }

        return <p key={key}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}
