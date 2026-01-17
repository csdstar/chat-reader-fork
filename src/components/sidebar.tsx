'use client';

import type { Book } from '@/types';
import { MessageSquare, PenSquare, PanelLeftClose, PanelLeft } from 'lucide-react';

interface SidebarProps {
  book: Book | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onChapterSelect: (index: number) => void;
  onNewChat: () => void;
}

export function Sidebar({ book, collapsed, onCollapsedChange, onChapterSelect, onNewChat }: SidebarProps) {
  // 收起状态：只显示一个展开按钮
  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center bg-zinc-100 border-r border-zinc-200 py-3">
        <button
          onClick={() => onCollapsedChange(false)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
          title="展开侧边栏"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // 展开状态
  return (
    <>
      {/* 移动端遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => onCollapsedChange(true)}
      />
      
      {/* 侧边栏：移动端 fixed 覆盖，桌面端正常布局 */}
      <div className="fixed md:relative inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-zinc-100 border-r border-zinc-200">
        {/* 顶部操作栏 */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 gap-2">
          <button
            onClick={onNewChat}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <PenSquare className="h-4 w-4" />
            <span>新聊天</span>
          </button>
          <button
            onClick={() => onCollapsedChange(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
            title="收起侧边栏"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        {/* 聊天历史（章节列表）- 可滚动 */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-1 pb-4">
            {book?.chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => {
                  onChapterSelect(index);
                  // 移动端选择章节后自动收起
                  if (window.innerWidth < 768) {
                    onCollapsedChange(true);
                  }
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm transition-colors active:bg-zinc-300 ${
                  index === book.currentChapterIndex
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{chapter.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 底部书名 */}
        {book && (
          <div className="flex-shrink-0 border-t border-zinc-200 p-3">
            <p className="text-xs text-zinc-500 truncate">《{book.title}》</p>
          </div>
        )}
      </div>
    </>
  );
}
