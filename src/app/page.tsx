'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ChatArea } from '@/components/chat-area';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ChapterSettingsDialog } from '@/components/chapter-settings-dialog';
import { SettingsDialog, DEFAULT_SETTINGS, type Settings } from '@/components/settings-dialog';
import { BossScreen, BOSS_SCENARIO_COUNT } from '@/components/boss-screen';
import { DEFAULT_CHAPTER_PATTERNS, parseBook, getNextParagraphs, advanceProgress, goToNextChapter, goToChapter } from '@/lib/book-parser';
import { parseEpub } from '@/lib/epub-parser';
import { saveBook, loadBook, saveMessages, loadMessages, saveBookSource, loadBookSource, clearBook, hasExistingBook } from '@/lib/storage';
import { getDefaultBook } from '@/lib/default-book';
import type { Book, BookSource, ChapterPattern, Message } from '@/types';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function rebuildBookSource(book: Book): BookSource {
  const lines = book.chapters.flatMap((chapter, index) => {
    const isSyntheticTitle = chapter.title === '全文' || (index === 0 && chapter.title === '序章');
    return [isSyntheticTitle ? '' : chapter.title, ...chapter.paragraphs].filter(Boolean);
  });

  return {
    type: 'txt',
    filename: `${book.title}.txt`,
    content: lines.join('\n\n'),
  };
}

const FAKE_PROMPTS = [
  '帮我分析一下这个需求文档，看看有没有遗漏的点',
  '这段代码的性能好像不太行，能帮我优化一下吗',
  '我不太理解这个设计模式，能详细解释一下吗',
  '继续说，我在听',
  '然后呢，后面发生了什么',
  '这个方案感觉有点复杂，有没有更简单的实现方式',
  '你觉得这个技术选型合理吗，有什么建议',
  '帮我写一个单元测试用例',
  '这个 bug 怎么复现的，能分析一下原因吗',
  '帮我 review 一下这段代码，看看有没有潜在问题',
  '这个接口的返回值格式对吗',
  '帮我把这个逻辑重构一下，现在太乱了',
  '你确定这样写没问题吗，我有点担心',
  '能不能举个具体的例子说明一下',
  '这个报错信息是什么意思',
];

function getTimeSeededBossScenarioIndex(previousIndex: number) {
  if (BOSS_SCENARIO_COUNT <= 1) return 0;

  const highResolutionTime = typeof performance === 'undefined'
    ? 0
    : Math.floor(performance.now() * 1000);
  const seed = Date.now() + highResolutionTime + Math.floor(Math.random() * 1000000);
  const nextIndex = seed % BOSS_SCENARIO_COUNT;

  if (nextIndex !== previousIndex) return nextIndex;

  const offset = 1 + (seed % (BOSS_SCENARIO_COUNT - 1));
  return (previousIndex + offset) % BOSS_SCENARIO_COUNT;
}

export default function Home() {
  const [book, setBook] = useState<Book | null>(null);
  const [bookSource, setBookSource] = useState<BookSource | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterSettingsOpen, setChapterSettingsOpen] = useState(false);
  const [bossMode, setBossMode] = useState(false);
  const [bossScenarioIndex, setBossScenarioIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCustomBook, setIsCustomBook] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [chapterPatterns, setChapterPatterns] = useState<ChapterPattern[]>(DEFAULT_CHAPTER_PATTERNS);
  const pendingFileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef<{ intervalId: NodeJS.Timeout; messageId: string; fullText: string; onComplete: () => void } | null>(null);
  const bossModeRef = useRef(false);
  const leftControlPressedRef = useRef(false);
  const rightControlPressedRef = useRef(false);
  const rightControlUsedWithOtherKeyRef = useRef(false);
  // React state updates are not synchronous enough to guard repeated keyboard events.
  const sendLockRef = useRef(false);
  const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const unlockSend = useCallback((delay = 0) => {
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    if (delay <= 0) {
      sendLockRef.current = false;
      unlockTimerRef.current = null;
      return;
    }
    unlockTimerRef.current = setTimeout(() => {
      sendLockRef.current = false;
      unlockTimerRef.current = null;
    }, delay);
  }, []);

  useEffect(() => () => {
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
  }, []);

  useEffect(() => {
    bossModeRef.current = bossMode;
  }, [bossMode]);

  const toggleBossMode = useCallback(() => {
    const nextBossMode = !bossModeRef.current;
    bossModeRef.current = nextBossMode;

    if (nextBossMode) {
      setBossScenarioIndex(previousIndex => getTimeSeededBossScenarioIndex(previousIndex));
    }

    setBossMode(nextBossMode);
  }, []);

  useEffect(() => {
    const isRightControl = (event: KeyboardEvent) => (
      event.code === 'ControlRight'
      || (event.key === 'Control' && event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT)
    );

    const isLeftControl = (event: KeyboardEvent) => (
      event.code === 'ControlLeft'
      || (event.key === 'Control' && event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT)
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isRightControl(event)) {
        if (event.repeat) return;
        rightControlPressedRef.current = true;
        rightControlUsedWithOtherKeyRef.current = leftControlPressedRef.current
          || event.altKey
          || event.shiftKey
          || event.metaKey;
        return;
      }

      if (isLeftControl(event)) {
        leftControlPressedRef.current = true;
        if (rightControlPressedRef.current) rightControlUsedWithOtherKeyRef.current = true;
        return;
      }

      if (rightControlPressedRef.current) {
        rightControlUsedWithOtherKeyRef.current = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isRightControl(event)) {
        const shouldToggle = rightControlPressedRef.current && !rightControlUsedWithOtherKeyRef.current;
        rightControlPressedRef.current = false;
        rightControlUsedWithOtherKeyRef.current = false;

        if (shouldToggle) {
          event.preventDefault();
          toggleBossMode();
        }
        return;
      }

      if (isLeftControl(event)) {
        leftControlPressedRef.current = false;
      }
    };

    const resetControlState = () => {
      leftControlPressedRef.current = false;
      rightControlPressedRef.current = false;
      rightControlUsedWithOtherKeyRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', resetControlState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', resetControlState);
    };
  }, [toggleBossMode]);

  // 加载保存的数据或使用默认书籍
  useEffect(() => {
    (async () => {
      const [savedBook, savedMessages, savedSource] = await Promise.all([
        loadBook(),
        loadMessages(),
        loadBookSource(),
      ]);
      if (savedBook) {
        setBook(savedBook);
        setBookSource(savedSource);
        setIsCustomBook(true);
        setChapterPatterns(savedBook.chapterPatterns || DEFAULT_CHAPTER_PATTERNS);
      } else {
        setBook(getDefaultBook());
        setIsCustomBook(false);
      }
      if (savedMessages.length > 0) setMessages(savedMessages);
    })();
  }, []);

  // 保存书籍（仅保存自定义书籍）
  useEffect(() => {
    if (book && isCustomBook) {
      saveBook(book);
    }
  }, [book, isCustomBook]);

  // 保存消息
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const processFile = useCallback(async (file: File) => {
    sendLockRef.current = true;
    setIsProcessingFile(true);
    setMessages([{ id: generateId(), role: 'system', content: `正在解析《${file.name}》...` }]);

    try {
      const buffer = await file.arrayBuffer();
      let newBook: Book;
      let newSource: BookSource | null = null;

      if (file.name.toLowerCase().endsWith('.epub')) {
        newBook = await parseEpub(buffer, file.name);
      } else {
        let content = new TextDecoder('utf-8').decode(buffer);
        if (content.includes('\uFFFD')) {
          content = new TextDecoder('gbk').decode(buffer);
        }
        newBook = parseBook(content, file.name, chapterPatterns);
        newSource = { type: 'txt', filename: file.name, content };
      }

      await clearBook();
      if (newSource) await saveBookSource(newSource);
      setBook(newBook);
      setBookSource(newSource);
      setIsCustomBook(true);
      setMessages([]);
      focusInput();
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setMessages([{ id: generateId(), role: 'system', content: `解析《${file.name}》失败：${message}` }]);
    } finally {
      setIsProcessingFile(false);
      unlockSend();
    }
  }, [chapterPatterns, focusInput, unlockSend]);

  const handleChapterPatternsApply = useCallback(async (patterns: ChapterPattern[]) => {
    const nextPatterns = [...patterns];
    setChapterPatterns(nextPatterns);

    const canReparse = !!book && isCustomBook && book.format !== 'epub' && book.format !== 'builtin';
    if (!canReparse) {
      setChapterSettingsOpen(false);
      return;
    }

    setIsProcessingFile(true);
    sendLockRef.current = true;
    try {
      const source = bookSource || rebuildBookSource(book);
      const reparsedBook = parseBook(source.content, source.filename, nextPatterns);

      await Promise.all([
        saveBookSource(source),
        saveBook(reparsedBook),
        saveMessages([]),
      ]);

      setBookSource(source);
      setBook(reparsedBook);
      setMessages([]);
      setIsCustomBook(true);
      setChapterSettingsOpen(false);
      focusInput();
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setMessages([{ id: generateId(), role: 'system', content: `重新划分章节失败：${message}` }]);
    } finally {
      setIsProcessingFile(false);
      unlockSend();
    }
  }, [book, bookSource, focusInput, isCustomBook, unlockSend]);

  const handleFileDrop = useCallback(async (file: File) => {
    const exists = await hasExistingBook();
    if (exists) {
      pendingFileRef.current = file;
      setConfirmOpen(true);
      return;
    }
    await processFile(file);
  }, [processFile]);

  const handleConfirmOverwrite = useCallback(async () => {
    setConfirmOpen(false);
    if (pendingFileRef.current) {
      await processFile(pendingFileRef.current);
      pendingFileRef.current = null;
    }
  }, [processFile]);

  const handleCancelOverwrite = useCallback(() => {
    setConfirmOpen(false);
    pendingFileRef.current = null;
  }, []);

  const streamText = useCallback((text: string, onComplete: () => void) => {
    const messageId = generateId();
    let currentIndex = 0;
    
    setMessages(prev => [...prev, { id: messageId, role: 'assistant', content: '' }]);

    const interval = setInterval(() => {
      currentIndex++;
      const currentText = text.slice(0, currentIndex);
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, content: currentText } : msg)
      );
      if (currentIndex >= text.length) {
        clearInterval(interval);
        streamingRef.current = null;
        onComplete();
      }
    }, Math.round(1000 / settings.typingSpeed));

    streamingRef.current = { intervalId: interval, messageId, fullText: text, onComplete };
  }, [settings.typingSpeed]);

  const skipStreaming = useCallback(() => {
    if (!streamingRef.current) return;
    const { intervalId, messageId, fullText, onComplete } = streamingRef.current;
    clearInterval(intervalId);
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, content: fullText } : msg)
    );
    streamingRef.current = null;
    onComplete();
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!book || sendLockRef.current || isStreaming || isProcessingFile) return false;
    sendLockRef.current = true;

    const displayContent = content || FAKE_PROMPTS[Math.floor(Math.random() * FAKE_PROMPTS.length)];
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: displayContent }]);
    const { paragraphs, isChapterEnd } = getNextParagraphs(book, settings.paragraphsPerMessage);
    
    if (paragraphs.length === 0) {
      const isLastChapter = book.currentChapterIndex >= book.chapters.length - 1;
      if (isLastChapter) {
        const endMessage = isCustomBook 
          ? '🎉 恭喜！你已读完整本书。' 
          : '🎉 使用指南已读完。拖入 txt 文件开始阅读你的小说吧！';
        setMessages(prev => [...prev, { id: generateId(), role: 'system', content: endMessage }]);
        unlockSend(250);
        focusInput();
        return true;
      }
      setMessages(prev => [...prev, { id: generateId(), role: 'system', content: '本章已读完，已进入下一章。' }]);
      setBook(goToNextChapter(book));
      unlockSend(250);
      focusInput();
      return true;
    }

    const text = paragraphs.join('\n\n');
    setIsStreaming(true);

    streamText(text, () => {
      const updatedBook = advanceProgress(book, paragraphs.length);
      const isLastChapter = book.currentChapterIndex >= book.chapters.length - 1;
      const nextBook = isChapterEnd && !isLastChapter
        ? goToNextChapter(updatedBook)
        : updatedBook;

      setBook(nextBook);
      setIsStreaming(false);
      focusInput();

      if (isChapterEnd) {
        const endMessage = isLastChapter
          ? (isCustomBook ? '🎉 恭喜！你已读完整本书。' : '🎉 使用指南已读完。拖入 txt 文件开始阅读你的小说吧！')
          : '本章已读完，已进入下一章。';
        setMessages(prev => [...prev, { id: generateId(), role: 'system', content: endMessage }]);
      }
      unlockSend(isChapterEnd ? 250 : 0);
    });
    return true;
  }, [book, isStreaming, isProcessingFile, streamText, isCustomBook, settings.paragraphsPerMessage, focusInput, unlockSend]);

  const handleChapterSelect = useCallback((index: number) => {
    if (!book || isStreaming) return;
    setBook(goToChapter(book, index));
    setMessages([]);
    focusInput();
  }, [book, isStreaming, focusInput]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && /\.(txt|epub)$/i.test(file.name)) {
      handleFileDrop(file);
    }
  }, [handleFileDrop]);

  return (
    <div 
      className="flex h-full bg-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar
        book={book}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onChapterSelect={handleChapterSelect}
        onFileSelect={handleFileDrop}
        onOpenChapterSettings={() => setChapterSettingsOpen(true)}
      />
      
      <ChatArea
        ref={inputRef}
        messages={messages}
        book={book}
        isStreaming={isStreaming}
        fontSize={settings.fontSize}
        onSendMessage={handleSendMessage}
        onSkipStreaming={skipStreaming}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      
      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <ChapterSettingsDialog
        open={chapterSettingsOpen}
        onOpenChange={setChapterSettingsOpen}
        selectedPatterns={chapterPatterns}
        currentBookTitle={book?.title}
        canReparseCurrentBook={!!book && isCustomBook && book.format !== 'epub' && book.format !== 'builtin'}
        onApply={handleChapterPatternsApply}
      />

      {bossMode && <BossScreen scenarioIndex={bossScenarioIndex} />}

      {isDragging && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-zinc-400">
                <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 15V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-lg font-medium text-zinc-700">释放以上传</p>
          </div>
        </div>
      )}
    </div>
  );
}
