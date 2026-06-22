'use client';

import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_CHAPTER_PATTERNS } from '@/lib/book-parser';
import type { ChapterPattern } from '@/types';

const PATTERN_OPTIONS: Array<{ value: ChapterPattern; label: string; example: string }> = [
  { value: 'chinese-standard', label: '标准中文章节', example: '第93章 新的旅程' },
  { value: 'volume', label: '卷标题', example: '卷一 / 第一卷' },
  { value: 'english', label: '英文章节', example: 'Chapter 12 / Chap. 12' },
  { value: 'numbered-punctuation', label: '数字 + 标点', example: '1.标题 / 2、标题' },
  { value: 'numbered-space', label: '数字 + 空格', example: '1 标题' },
];

interface ChapterSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPatterns: ChapterPattern[];
  currentBookTitle?: string;
  canReparseCurrentBook: boolean;
  onApply: (patterns: ChapterPattern[]) => void | Promise<void>;
}

export function ChapterSettingsDialog(props: ChapterSettingsDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <ChapterSettingsPanel {...props} />}
    </Dialog>
  );
}

function ChapterSettingsPanel({
  onOpenChange,
  selectedPatterns,
  currentBookTitle,
  canReparseCurrentBook,
  onApply,
}: ChapterSettingsDialogProps) {
  const [patterns, setPatterns] = useState<ChapterPattern[]>(selectedPatterns);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(patterns);
    } finally {
      setIsApplying(false);
    }
  };

  const togglePattern = (pattern: ChapterPattern) => {
    setPatterns(current =>
      current.includes(pattern) ? current.filter(item => item !== pattern) : [...current, pattern]
    );
  };

  const selectedLabel = patterns.length === 0
    ? '不自动划分章节'
    : patterns.length === PATTERN_OPTIONS.length
      ? '全部常见格式'
      : patterns.length === 1
        ? PATTERN_OPTIONS.find(option => option.value === patterns[0])?.label
        : `已选择 ${patterns.length} 种格式`;

  return (
    <DialogContent
      className="max-h-[calc(100dvh-1.5rem)] gap-3 overflow-y-auto p-5 sm:max-w-md"
      showCloseButton={false}
    >
      <DialogHeader>
        <DialogTitle>章节识别</DialogTitle>
        <DialogDescription>
          {canReparseCurrentBook
            ? `应用后将重新划分《${currentBookTitle}》并重置阅读进度。`
            : '当前设置将用于下一本上传的 TXT；EPUB 使用书内目录。'}
        </DialogDescription>
      </DialogHeader>

      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        title="关闭"
      >
        <X className="h-4 w-4" />
      </button>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">章节标题格式</label>
        <button
          type="button"
          onClick={() => setDropdownOpen(open => !open)}
          aria-expanded={dropdownOpen}
          className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <span>{selectedLabel}</span>
          <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-sm">
            {PATTERN_OPTIONS.map(option => {
              const checked = patterns.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-zinc-50"
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'}`}>
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePattern(option.value)}
                    className="sr-only"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-zinc-800">{option.label}</span>
                    <span className="block truncate text-xs text-zinc-500">{option.example}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setPatterns(['chinese-standard'])}>
          仅标准中文
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPatterns(DEFAULT_CHAPTER_PATTERNS)}>
          全部选择
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
        <Button disabled={isApplying} onClick={handleApply}>
          {isApplying ? '重新解析中...' : '应用'}
        </Button>
      </div>
    </DialogContent>
  );
}
