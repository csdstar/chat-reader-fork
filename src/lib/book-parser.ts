import type { Book, Chapter, ChapterPattern } from '@/types';

const WRAPPER_CHARS_REGEX = /^[\s"'“”‘’「」『』《》【】\[\]()（）]+|[\s"'“”‘’」』》】\])）]+$/g;
const CJK_NUMBER = '一二三四五六七八九十百千万零〇两俩0-9';
const TITLE_BOUNDARY = '(?:\\s+|[：:（(【\\[—-]|$)';
const CHINESE_CHAPTER_REGEX = new RegExp(
  `^第\\s*[${CJK_NUMBER}]+\\s*[章节回部集篇话]${TITLE_BOUNDARY}`,
  'i'
);
const VOLUME_CHAPTER_REGEX = new RegExp(
  `^(?:第\\s*[${CJK_NUMBER}]+\\s*卷|卷\\s*[${CJK_NUMBER}]+)${TITLE_BOUNDARY}`,
  'i'
);
const ENGLISH_CHAPTER_REGEX = new RegExp(`^(?:chapter|chap\\.?)\\s*\\d+${TITLE_BOUNDARY}`, 'i');
const NUMBERED_CHAPTER_REGEX = /^(\d{1,5}|[一二三四五六七八九十百千万零〇两俩]{1,8})\s*([.．、:：]|[)\]）】])\s*(?!\d)\S.{0,100}$/;
const NUMBER_SPACE_CHAPTER_REGEX = /^\d{1,5}\s+\S.{0,80}$/;

export const DEFAULT_CHAPTER_PATTERNS: ChapterPattern[] = [
  'chinese-standard',
  'volume',
  'english',
  'numbered-punctuation',
  'numbered-space',
];

const CHAPTER_PATTERN_TESTS: Record<ChapterPattern, RegExp> = {
  'chinese-standard': CHINESE_CHAPTER_REGEX,
  volume: VOLUME_CHAPTER_REGEX,
  english: ENGLISH_CHAPTER_REGEX,
  'numbered-punctuation': NUMBERED_CHAPTER_REGEX,
  'numbered-space': NUMBER_SPACE_CHAPTER_REGEX,
};

function normalizeChapterCandidate(line: string) {
  return line.trim().replace(WRAPPER_CHARS_REGEX, '').trim();
}

export function isChapterTitle(line: string, patterns: ChapterPattern[] = DEFAULT_CHAPTER_PATTERNS) {
  const normalized = normalizeChapterCandidate(line);
  if (!normalized || normalized.length > 120) return false;
  return patterns.some(pattern => CHAPTER_PATTERN_TESTS[pattern].test(normalized));
}

function addChapter(chapters: Chapter[], title: string, paragraphs: string[]) {
  const cleanedParagraphs = paragraphs.filter(p => p.length > 0);
  if (cleanedParagraphs.length > 0) {
    chapters.push({ title, paragraphs: cleanedParagraphs });
  }
}

export function parseBook(
  content: string,
  filename: string,
  chapterPatterns: ChapterPattern[] = DEFAULT_CHAPTER_PATTERNS
): Book {
  const lines = content.split(/\r\n|\n|\r/);
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let currentParagraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (isChapterTitle(trimmed, chapterPatterns)) {
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
    format: 'txt',
    chapterPatterns,
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
