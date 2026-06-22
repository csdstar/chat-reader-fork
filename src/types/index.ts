export interface Chapter {
  title: string;
  paragraphs: string[];
}

export type ChapterPattern =
  | 'chinese-standard'
  | 'volume'
  | 'english'
  | 'numbered-punctuation'
  | 'numbered-space';

export interface BookSource {
  type: 'txt';
  filename: string;
  content: string;
}

export interface Book {
  title: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  currentParagraphIndex: number;
  format?: 'txt' | 'epub' | 'builtin';
  chapterPatterns?: ChapterPattern[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
}
