'use client';

import { useRef } from 'react';
import Image from 'next/image';
import type { Book } from '@/types';
import { PanelLeftClose, Check } from 'lucide-react';

const NAV_ITEMS = [
  { label: '搜索聊天', icon: '/icons/search-chat.svg' },
  { label: '库', icon: '/icons/library.svg' },
  { label: '项目', icon: '/icons/projects.svg' },
  { label: '应用', icon: '/icons/apps.svg' },
  { label: '更多', icon: '/icons/more.svg' },
];

function SidebarIcon({ src, alt, className = 'h-6 w-6' }: { src: string; alt: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className={`${className} shrink-0 object-contain`}
      priority={src.includes('chatgpt')}
    />
  );
}

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
  onOpenChapterSettings: () => void;
}

export function Sidebar({
  book,
  collapsed,
  onCollapsedChange,
  onChapterSelect,
  onFileSelect,
  onOpenChapterSettings,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && /\.(txt|epub)$/i.test(file.name)) {
      onFileSelect(file);
      // 移动端选择文件后自动收起
      if (window.innerWidth < 768) {
        onCollapsedChange(true);
      }
    }
    // 重置 input，允许重复选择同一文件
    e.target.value = '';
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".txt,.epub"
      onChange={handleFileChange}
      className="hidden"
    />
  );

  if (collapsed) {
    return (
      <>
        {fileInput}
        <aside className="flex h-full w-[52px] shrink-0 flex-col items-center bg-white py-4">
          <button
            onClick={() => onCollapsedChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f3f3f3] active:bg-[#ededed] transition-colors"
            title="展开侧边栏"
          >
            <SidebarIcon src="/icons/chatgpt.svg" alt="ChatGPT" className="h-[26px] w-[26px]" />
          </button>

          <div className="mt-9 flex flex-col items-center gap-5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f3f3f3] active:bg-[#ededed] transition-colors"
              title="新聊天"
            >
              <SidebarIcon src="/icons/new-chat.svg" alt="新聊天" className="h-[23px] w-[23px]" />
            </button>
            <button
              onClick={() => onCollapsedChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f3f3f3] active:bg-[#ededed] transition-colors"
              title="搜索聊天"
            >
              <SidebarIcon src="/icons/search-chat.svg" alt="搜索聊天" className="h-[24px] w-[24px]" />
            </button>
            <button
              onClick={() => onCollapsedChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f3f3f3] active:bg-[#ededed] transition-colors"
              title="聊天"
            >
              <SidebarIcon src="/icons/chat.svg" alt="聊天" className="h-[25px] w-[25px]" />
            </button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {fileInput}

      {/* 移动端遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={() => onCollapsedChange(true)}
      />
      
      {/* 侧边栏：移动端 fixed 覆盖，桌面端正常布局 */}
      <aside className="fixed md:relative inset-y-0 left-0 z-50 flex h-full w-[260px] flex-col bg-[#f9f9f9]">
        <div className="flex-shrink-0 px-2 pb-2 pt-5">
          <div className="mb-5 flex h-8 items-center justify-between px-4">
            <div className="text-[22px] font-semibold leading-none tracking-normal text-black">ChatGPT</div>
            <button
              onClick={() => onCollapsedChange(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8a8a8a] hover:bg-[#efefef] active:bg-[#e8e8e8] transition-colors"
              title="收起侧边栏"
            >
              <PanelLeftClose className="h-[22px] w-[22px]" strokeWidth={1.8} />
            </button>
          </div>

        </div>

        {/* 伪装导航 + 聊天历史使用同一个滚动区域 */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-full items-center gap-2.5 rounded-lg bg-[#f1f1f1] px-4 text-[15px] font-normal text-[#0f0f0f] transition-colors hover:bg-[#ededed] active:bg-[#e8e8e8]"
          >
            <SidebarIcon src="/icons/new-chat.svg" alt="" className="h-5 w-5" />
            <span>新聊天</span>
          </button>

          <nav className="mt-1 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const content = (
                <>
                  <SidebarIcon src={item.icon} alt="" className="h-5 w-5" />
                  <span>{item.label}</span>
                </>
              );
              const className = 'flex h-11 w-full items-center gap-2.5 rounded-lg px-4 text-[15px] font-normal text-[#0f0f0f] transition-colors hover:bg-[#f1f1f1]';

              return item.label === '应用' ? (
                <button key={item.label} type="button" onClick={onOpenChapterSettings} className={className}>
                  {content}
                </button>
              ) : (
                <div key={item.label} className={className}>
                  {content}
                </div>
              );
            })}
          </nav>

          {book && (
            <div className="mb-2 mt-5 px-4 text-xs font-medium text-[#8a8a8a]">
              今天
            </div>
          )}
          <div className="space-y-0.5">
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
                  className={`flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors active:bg-[#e8e8e8] ${
                    index === book.currentChapterIndex
                      ? 'bg-[#efefef] text-[#171717]'
                      : 'text-[#4f4f4f] hover:bg-[#efefef]'
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
          <div className="flex-shrink-0 px-4 py-3">
            <p className="truncate rounded-lg px-2 py-2 text-xs text-[#7a7a7a] hover:bg-[#efefef]">《{book.title}》</p>
          </div>
        )}
      </aside>
    </>
  );
}
