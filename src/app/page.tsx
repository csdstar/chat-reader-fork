'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ChatArea } from '@/components/chat-area';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SettingsDialog, SPEED_DELAYS, type Settings } from '@/components/settings-dialog';
import { parseBook, getNextParagraphs, advanceProgress, goToNextChapter, goToChapter } from '@/lib/book-parser';
import { saveBook, loadBook, saveMessages, loadMessages, clearBook, hasExistingBook } from '@/lib/storage';
import { getDefaultBook } from '@/lib/default-book';
import type { Book, Message } from '@/types';

const DEFAULT_SETTINGS: Settings = {
  paragraphsPerMessage: 3,
  speed: 'medium',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function Home() {
  const [book, setBook] = useState<Book | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCustomBook, setIsCustomBook] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const pendingFileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 加载保存的数据或使用默认书籍
  useEffect(() => {
    (async () => {
      const savedBook = await loadBook();
      const savedMessages = await loadMessages();
      if (savedBook) {
        setBook(savedBook);
        setIsCustomBook(true);
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
    const buffer = await file.arrayBuffer();
    let content = new TextDecoder('utf-8').decode(buffer);
    if (content.includes('\uFFFD')) {
      content = new TextDecoder('gbk').decode(buffer);
    }
    const newBook = parseBook(content, file.name);
    await clearBook();
    setBook(newBook);
    setIsCustomBook(true);
    setMessages([]);
    focusInput();
  }, [focusInput]);

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
    const delay = SPEED_DELAYS[settings.speed];
    
    setMessages(prev => [...prev, { id: messageId, role: 'assistant', content: '' }]);

    const interval = setInterval(() => {
      currentIndex++;
      const currentText = text.slice(0, currentIndex);
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, content: currentText } : msg)
      );
      if (currentIndex >= text.length) {
        clearInterval(interval);
        onComplete();
      }
    }, delay);
  }, [settings.speed]);

  const handleSendMessage = useCallback((content: string) => {
    if (!book || isStreaming) return;

    setMessages(prev => [...prev, { id: generateId(), role: 'user', content }]);
    const { paragraphs, isChapterEnd } = getNextParagraphs(book, settings.paragraphsPerMessage);
    
    if (paragraphs.length === 0) {
      const isLastChapter = book.currentChapterIndex >= book.chapters.length - 1;
      if (isLastChapter) {
        const endMessage = isCustomBook 
          ? '🎉 恭喜！你已读完整本书。' 
          : '🎉 使用指南已读完。拖入 txt 文件开始阅读你的小说吧！';
        setMessages(prev => [...prev, { id: generateId(), role: 'system', content: endMessage }]);
        focusInput();
        return;
      }
      setMessages(prev => [...prev, { id: generateId(), role: 'system', content: '本章已读完，发送任意消息进入下一章。' }]);
      setBook(goToNextChapter(book));
      focusInput();
      return;
    }

    const text = paragraphs.join('\n\n');
    setIsStreaming(true);

    streamText(text, () => {
      setIsStreaming(false);
      const updatedBook = advanceProgress(book, paragraphs.length);
      setBook(updatedBook);
      focusInput();

      if (isChapterEnd) {
        const isLastChapter = book.currentChapterIndex >= book.chapters.length - 1;
        setTimeout(() => {
          const endMessage = isLastChapter
            ? (isCustomBook ? '🎉 恭喜！你已读完整本书。' : '🎉 使用指南已读完。拖入 txt 文件开始阅读你的小说吧！')
            : '本章已读完，发送任意消息进入下一章。';
          setMessages(prev => [...prev, { id: generateId(), role: 'system', content: endMessage }]);
          if (!isLastChapter) {
            setBook(prev => prev ? goToNextChapter(prev) : null);
          }
        }, 500);
      }
    });
  }, [book, isStreaming, streamText, isCustomBook, settings.paragraphsPerMessage, focusInput]);

  const handleChapterSelect = useCallback((index: number) => {
    if (!book || isStreaming) return;
    setBook(goToChapter(book, index));
    setMessages([]);
    focusInput();
  }, [book, isStreaming, focusInput]);

  const handleNewChat = useCallback(() => {
    if (!book) return;
    setMessages([]);
    focusInput();
  }, [book, focusInput]);

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
    if (file && file.name.endsWith('.txt')) {
      handleFileDrop(file);
    }
  }, [handleFileDrop]);

  return (
    <div 
      className="flex h-screen bg-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar
        book={book}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onChapterSelect={handleChapterSelect}
        onNewChat={handleNewChat}
      />
      
      <ChatArea
        ref={inputRef}
        messages={messages}
        book={book}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
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
