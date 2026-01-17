'use client';

import { useRef } from 'react';
import type { Book } from '@/types';
import { Upload, PanelLeftClose, PanelLeft, Check } from 'lucide-react';

function ProgressCircle({ percent }: { percent: number }) {
  const isComplete = percent >= 100;
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  if (isComplete) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 flex-shrink-0">
        <Check className="h-3 w-3 text-zinc-100" />
      </div>
    );
  }

  return (
    <div className="relative flex h-5 w-5 items-center justify-center flex-shrink-0">
      <svg className="h-5 w-5 -rotate-90" viewBox="0 0 16 16">
        {/* 背景虚线圈 */}
        <circle 
          cx="8" 
          cy="8" 
          r={radius} 
          fill="none" 
          stroke="#d4d4d8" 
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        {/* 进度实线 */}
        <circle 
          cx="8" 
          cy="8" 
          r={radius} 
          fill="none" 
          stroke="#52525b" 
          strokeWidth="1.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

interface SidebarProps {
  book: Book | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onChapterSelect: (index: number) => void;
  onFileSelect: (file: File) => void;
}

export function Sidebar({ book, collapsed, onCollapsedChange, onChapterSelect, onFileSelect }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      onFileSelect(file);
      // 移动端选择文件后自动收起
      if (window.innerWidth < 768) {
        onCollapsedChange(true);
      }
    }
    // 重置 input，允许重复选择同一文件
    e.target.value = '';
  };

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
      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="hidden"
      />

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
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>新的话题</span>
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
            {book?.chapters.map((chapter, index) => {
              // 计算进度
              let percent = 0;
              if (index < book.currentChapterIndex) {
                percent = 100;
              } else if (index === book.currentChapterIndex) {
                percent = chapter.paragraphs.length > 0
                  ? Math.round((book.currentParagraphIndex / chapter.paragraphs.length) * 100)
                  : 0;
              }

              return (
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
                  <ProgressCircle percent={percent} />
                  <span className="truncate">{chapter.title}</span>
                </button>
              );
            })}
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
