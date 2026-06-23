'use client';

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import type { Message, Book } from '@/types';
import { Settings, Github, ArrowDown } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  book: Book | null;
  isStreaming: boolean;
  fontSize: number;
  onSendMessage: (content: string) => boolean;
  onSkipStreaming: () => void;
  onOpenSettings: () => void;
}

export const ChatArea = forwardRef<HTMLTextAreaElement, ChatAreaProps>(
  function ChatArea({ messages, book, isStreaming, fontSize, onSendMessage, onSkipStreaming, onOpenSettings }, inputRef) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const resumeAutoScroll = useCallback(() => {
      setAutoScroll(true);
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }, []);

    const scrollToBottom = useCallback(() => {
      if (!scrollRef.current) return;
      setAutoScroll(true);
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, []);

    const handleSendMessage = useCallback((content: string) => {
      const accepted = onSendMessage(content);
      if (accepted) resumeAutoScroll();
      return accepted;
    }, [onSendMessage, resumeAutoScroll]);

    const handleSkipStreaming = useCallback(() => {
      resumeAutoScroll();
      onSkipStreaming();
    }, [onSkipStreaming, resumeAutoScroll]);

    const handleScroll = useCallback(() => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }, []);

    useEffect(() => {
      if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages, autoScroll]);

    return (
      <div className="flex flex-1 flex-col bg-white min-w-0">
        {/* 顶部标题栏 */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <div />
          <span className="text-sm font-medium text-zinc-800">ChatGPT 5.2</span>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/liuzhao1225/chat-reader"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
              title="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <button
              onClick={onOpenSettings}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
              title="设置"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 聊天内容 - 可滚动，滚动条始终占位 */}
        <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-scroll">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-2xl font-medium text-zinc-800 mb-8">有什么可以帮忙的?</h1>
              </div>
            )}
            
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} fontSize={fontSize} />
              ))}
            </div>
          </div>
          
          {/* 滚动到底部按钮 */}
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 shadow-md border border-zinc-200 hover:bg-zinc-200 transition-colors"
              title="滚动到底部"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 输入框 */}
        <div className="flex-shrink-0 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-2">
            <ChatInput
              ref={inputRef}
              onSend={handleSendMessage}
              disabled={!book}
              placeholder={isStreaming ? '' : '有问题，尽管问'}
              isStreaming={isStreaming}
              onSkipStreaming={handleSkipStreaming}
            />
          </div>
        </div>
      </div>
    );
  }
);
