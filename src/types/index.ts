export interface Chapter {
  title: string;
  paragraphs: string[];
}

export interface Book {
  title: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  currentParagraphIndex: number;
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
