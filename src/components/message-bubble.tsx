import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  fontSize?: number;
}

export function MessageBubble({ message, fontSize = 16 }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-3xl bg-zinc-100 px-5 py-3">
          <p 
            className="text-zinc-800 whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px` }}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2">
          <p className="text-sm text-amber-700">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p 
        className="text-zinc-800 whitespace-pre-wrap leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
      >
        {message.content}
      </p>
    </div>
  );
}
