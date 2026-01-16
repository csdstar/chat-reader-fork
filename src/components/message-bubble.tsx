import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  fontSize?: number;
}

export function MessageBubble({ message, fontSize = 14 }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] rounded-3xl bg-zinc-100 px-5 py-3">
          <p className="text-sm text-zinc-800 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center mb-6">
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2">
          <p className="text-sm text-amber-700">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex-1 pt-1">
        <p 
          className="text-zinc-800 whitespace-pre-wrap leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
