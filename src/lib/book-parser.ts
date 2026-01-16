import type { Book, Chapter } from '@/types';

const CHAPTER_REGEX = /^(第[一二三四五六七八九十百千万零〇0-9]+[章节回卷部集篇]|Chapter\s*\d+|CHAPTER\s*\d+|卷[一二三四五六七八九十百千万零〇0-9]+).*/;

export function parseBook(content: string, filename: string): Book {
  const lines = content.split(/\r?\n/);
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let currentParagraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (CHAPTER_REGEX.test(trimmed)) {
      // 保存上一章
      if (currentChapter) {
        currentChapter.paragraphs = currentParagraphs.filter(p => p.length > 0);
        if (currentChapter.paragraphs.length > 0) {
          chapters.push(currentChapter);
        }
      }
      // 开始新章节
      currentChapter = { title: trimmed, paragraphs: [] };
      currentParagraphs = [];
      continue;
    }

    if (trimmed) {
      currentParagraphs.push(trimmed);
    }
  }

  // 保存最后一章
  if (currentChapter) {
    currentChapter.paragraphs = currentParagraphs.filter(p => p.length > 0);
    if (currentChapter.paragraphs.length > 0) {
      chapters.push(currentChapter);
    }
  }

  // 如果没有检测到章节，将整个内容作为一章
  if (chapters.length === 0) {
    const paragraphs = lines.map(l => l.trim()).filter(l => l.length > 0);
    chapters.push({ title: '全文', paragraphs });
  }

  const title = filename.replace(/\.txt$/i, '');

  return {
    title,
    chapters,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
  };
}

export function getNextParagraphs(book: Book, count: number = 3): { paragraphs: string[]; isChapterEnd: boolean } {
  const chapter = book.chapters[book.currentChapterIndex];
  if (!chapter) return { paragraphs: [], isChapterEnd: true };

  const start = book.currentParagraphIndex;
  const end = Math.min(start + count, chapter.paragraphs.length);
  const paragraphs = chapter.paragraphs.slice(start, end);
  const isChapterEnd = end >= chapter.paragraphs.length;

  return { paragraphs, isChapterEnd };
}

export function advanceProgress(book: Book, paragraphCount: number): Book {
  const chapter = book.chapters[book.currentChapterIndex];
  if (!chapter) return book;

  const newIndex = book.currentParagraphIndex + paragraphCount;
  
  return {
    ...book,
    currentParagraphIndex: Math.min(newIndex, chapter.paragraphs.length),
  };
}

export function goToNextChapter(book: Book): Book {
  const nextIndex = book.currentChapterIndex + 1;
  if (nextIndex >= book.chapters.length) return book;

  return {
    ...book,
    currentChapterIndex: nextIndex,
    currentParagraphIndex: 0,
  };
}

export function goToChapter(book: Book, chapterIndex: number): Book {
  if (chapterIndex < 0 || chapterIndex >= book.chapters.length) return book;

  return {
    ...book,
    currentChapterIndex: chapterIndex,
    currentParagraphIndex: 0,
  };
}
