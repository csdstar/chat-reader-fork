import type { Book, Chapter } from '@/types';
import type { Book as EpubBook, NavItem } from 'epubjs';

type EpubSection = {
  href: string;
  index: number;
  linear?: boolean;
  document?: Document;
  load: (request?: EpubBook['load']) => Promise<Element>;
  unload: () => void;
};

function cleanText(value: string | null | undefined) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function stripFragment(path: string) {
  return decodeURIComponent(path.split('#')[0] || '');
}

function flattenToc(items: NavItem[] = []): NavItem[] {
  return items.flatMap(item => [item, ...flattenToc(item.subitems || [])]);
}

function findTocTitle(toc: NavItem[], href: string) {
  const normalizedHref = stripFragment(href);
  const item = toc.find(entry => {
    const entryHref = stripFragment(entry.href);
    return entryHref === normalizedHref || entryHref.endsWith(`/${normalizedHref}`) || normalizedHref.endsWith(`/${entryHref}`);
  });
  return cleanText(item?.label);
}

function extractDocumentTitle(document: Document) {
  const heading = document.querySelector('h1, h2, h3, h4, h5, h6');
  return cleanText(heading?.textContent) || cleanText(document.querySelector('title')?.textContent);
}

function extractParagraphs(document: Document, title: string) {
  const root = document.body || document.documentElement;
  root.querySelectorAll('script, style, svg, nav').forEach(node => node.remove());

  const blockSelectors = 'p, li, blockquote';
  let paragraphs = Array.from(root.querySelectorAll(blockSelectors)).map(node => cleanText(node.textContent));

  if (paragraphs.length === 0) {
    paragraphs = Array.from(root.querySelectorAll('div, section, article'))
      .filter(node => node.querySelector(blockSelectors) === null)
      .map(node => cleanText(node.textContent));
  }

  if (paragraphs.length === 0) {
    const wholeText = cleanText(root.textContent);
    paragraphs = wholeText ? [wholeText] : [];
  }

  const cleaned: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph || paragraph === title) continue;
    if (cleaned[cleaned.length - 1] === paragraph) continue;
    cleaned.push(paragraph);
  }
  return cleaned;
}

export async function parseEpub(buffer: ArrayBuffer, filename: string): Promise<Book> {
  const { default: ePub } = await import('epubjs');
  const epubBook = ePub({ openAs: 'binary' });

  try {
    await epubBook.open(buffer, 'binary');
    await epubBook.ready;
    const [metadata, navigation] = await Promise.all([
      epubBook.loaded.metadata.catch(() => null),
      epubBook.loaded.navigation.catch(() => null),
    ]);
    const toc = flattenToc(navigation?.toc || []);
    const sections: EpubSection[] = [];

    epubBook.spine.each((section: EpubSection) => {
      if (section.linear !== false) sections.push(section);
    });

    const chapters: Chapter[] = [];
    for (const section of sections) {
      await section.load(epubBook.load.bind(epubBook));
      const document = section.document;
      if (!document) continue;

      const title = findTocTitle(toc, section.href) || extractDocumentTitle(document) || `第 ${section.index + 1} 节`;
      const paragraphs = extractParagraphs(document, title);
      if (paragraphs.length > 0) {
        chapters.push({ title, paragraphs });
      }
      section.unload();
    }

    if (chapters.length === 0) {
      throw new Error('未能从 EPUB 中读取到正文内容');
    }

    return {
      title: cleanText(metadata?.title) || filename.replace(/\.epub$/i, ''),
      chapters,
      currentChapterIndex: 0,
      currentParagraphIndex: 0,
    };
  } finally {
    epubBook.destroy();
  }
}
