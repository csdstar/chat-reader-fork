'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Book } from '@/types';
import { PanelLeftClose, Check, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'search', label: '搜索聊天', icon: '/icons/search-chat.svg' },
  { id: 'library', label: '库', icon: '/icons/library.svg' },
  { id: 'projects', label: '项目', icon: '/icons/projects.svg' },
  { id: 'apps', label: '应用', icon: '/icons/apps.svg' },
  { id: 'more', label: '更多', icon: '/icons/more.svg' },
] as const;

const USER_PROFILE = {
  name: 'csdstar',
  plan: 'Plus会员',
  initial: 'C',
};

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

function AccountAvatar({ className = 'h-8 w-8 text-sm' }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#202123] font-medium text-white ${className}`}>
      {USER_PROFILE.initial}
    </div>
  );
}

function AccountProfile({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[#f3f3f3] active:bg-[#ededed]"
        title={`${USER_PROFILE.name} · ${USER_PROFILE.plan}`}
      >
        <AccountAvatar className="h-7 w-7 text-xs" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="flex h-12 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-[#efefef] active:bg-[#e8e8e8]"
    >
      <AccountAvatar />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[#171717]">{USER_PROFILE.name}</div>
        <div className="truncate text-xs text-[#777]">{USER_PROFILE.plan}</div>
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-[#8a8a8a]" strokeWidth={1.8} />
    </button>
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
  const chapterButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const revealCurrentChapterPendingRef = useRef(false);

  useEffect(() => {
    chapterButtonRefs.current = chapterButtonRefs.current.slice(0, book?.chapters.length ?? 0);
  }, [book?.chapters.length]);

  const scrollCurrentChapterIntoView = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!book) return;

    chapterButtonRefs.current[book.currentChapterIndex]?.scrollIntoView({
      behavior,
      block: 'center',
      inline: 'nearest',
    });
  }, [book]);

  const handleRevealCurrentChapter = useCallback(() => {
    if (collapsed) {
      revealCurrentChapterPendingRef.current = true;
      onCollapsedChange(false);
      return;
    }

    scrollCurrentChapterIntoView();
  }, [collapsed, onCollapsedChange, scrollCurrentChapterIntoView]);

  useEffect(() => {
    if (collapsed || !revealCurrentChapterPendingRef.current) return;

    revealCurrentChapterPendingRef.current = false;
    const frameId = window.requestAnimationFrame(() => scrollCurrentChapterIntoView());
    return () => window.cancelAnimationFrame(frameId);
  }, [collapsed, scrollCurrentChapterIntoView]);

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
        <aside className="flex h-full w-[52px] shrink-0 flex-col items-center justify-between bg-white py-4">
          <div className="flex flex-col items-center">
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
                onClick={handleRevealCurrentChapter}
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
          </div>

          <AccountProfile compact />
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

              if (item.id === 'search') {
                return (
                  <button key={item.id} type="button" onClick={handleRevealCurrentChapter} className={className}>
                    {content}
                  </button>
                );
              }

              return item.id === 'apps' ? (
                <button key={item.label} type="button" onClick={onOpenChapterSettings} className={className}>
                  {content}
                </button>
              ) : (
                <div key={item.id} className={className}>
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
                  ref={(node) => {
                    chapterButtonRefs.current[index] = node;
                  }}
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

        <div className="flex-shrink-0 border-t border-black/5 px-2 py-2">
          {book && (
            <p className="mb-1 truncate rounded-lg px-2 py-2 text-xs text-[#7a7a7a] hover:bg-[#efefef]">《{book.title}》</p>
          )}
          <AccountProfile />
        </div>
      </aside>
    </>
  );
}
