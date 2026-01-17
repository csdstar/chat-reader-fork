'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { ArrowUp, FastForward } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
  onSkipStreaming?: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ onSend, disabled, placeholder = '有问题，尽管问', isStreaming, onSkipStreaming }, ref) {
    const [value, setValue] = useState('');
    const isComposingRef = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled) return;
      onSend(value.trim());
      setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // 如果正在 IME 组合输入中，不处理回车
      if (isComposingRef.current) return;
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isStreaming && onSkipStreaming) {
          onSkipStreaming();
        } else {
          handleSubmit(e);
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '200px' }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onSkipStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white transition-opacity hover:opacity-80 active:opacity-70"
              title="立即回答"
            >
              <FastForward className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    );
  }
);
