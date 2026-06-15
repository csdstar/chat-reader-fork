import type { Book, Chapter } from '@/types';

const WRAPPER_CHARS_REGEX = /^[\s"'“”‘’「」『』《》【】\[\]()（）]+|[\s"'“”‘’」』》】\])）]+$/g;
const CJK_NUMBER = '一二三四五六七八九十百千万零〇两俩0-9';
const STANDARD_CHAPTER_REGEX = new RegExp(
  `^(第\\s*[${CJK_NUMBER}]+\\s*[章节回卷部集篇话]|卷\\s*[${CJK_NUMBER}]+|chapter\\s*\\d+|chap\\.?\\s*\\d+)`,
  'i'
);
const NUMBERED_CHAPTER_REGEX = /^(\d{1,5}|[一二三四五六七八九十百千万零〇两俩]{1,8})\s*([.．、:：]|[)\]）】])\s*(?!\d)\S.{0,100}$/;
const NUMBER_SPACE_CHAPTER_REGEX = /^\d{1,5}\s+\S.{0,80}$/;

function normalizeChapterCandidate(line: string) {
  return line.trim().replace(WRAPPER_CHARS_REGEX, '').trim();
}

export function isChapterTitle(line: string) {
  const normalized = normalizeChapterCandidate(line);
  if (!normalized || normalized.length > 120) return false;
  return (
    STANDARD_CHAPTER_REGEX.test(normalized) ||
    NUMBERED_CHAPTER_REGEX.test(normalized) ||
    NUMBER_SPACE_CHAPTER_REGEX.test(normalized)
  );
}

function addChapter(chapters: Chapter[], title: string, paragraphs: string[]) {
  const cleanedParagraphs = paragraphs.filter(p => p.length > 0);
  if (cleanedParagraphs.length > 0) {
    chapters.push({ title, paragraphs: cleanedParagraphs });
  }
}

export function parseBook(content: string, filename: string): Book {
  const lines = content.split(/\r\n|\n|\r/);
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let currentParagraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (isChapterTitle(trimmed)) {
      // 保存上一章
      if (currentChapter) {
        addChapter(chapters, currentChapter.title, currentParagraphs);
      } else {
        addChapter(chapters, '序章', currentParagraphs);
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
    addChapter(chapters, currentChapter.title, currentParagraphs);
  }

  // 如果没有检测到章节，将整个内容作为一章
  if (chapters.length === 0) {
    const paragraphs = lines.map(l => l.trim()).filter(l => l.length > 0);
    chapters.push({ title: '全文', paragraphs });
  }

  const title = filename.replace(/\.(txt|epub)$/i, '');

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
