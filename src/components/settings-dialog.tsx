'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw, X } from 'lucide-react';

export interface Settings {
  paragraphsPerMessage: number;
  typingSpeed: number; // characters per second (5-50)
  fontSize: number; // px (12-24)
}

export const DEFAULT_SETTINGS: Settings = {
  paragraphsPerMessage: 3,
  typingSpeed: 30, // 30 字/秒
  fontSize: 16,
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  // 打开时同步设置
  useEffect(() => {
    if (open) setLocalSettings(settings);
  }, [open, settings]);

  const handleParagraphsChange = (value: number) => {
    const clamped = Math.max(1, Math.min(10, value || 1));
    setLocalSettings(prev => ({ ...prev, paragraphsPerMessage: clamped }));
  };

  const handleSpeedChange = (value: number) => {
    const clamped = Math.max(5, Math.min(50, value || 30));
    setLocalSettings(prev => ({ ...prev, typingSpeed: clamped }));
  };

  const handleFontSizeChange = (value: number) => {
    const clamped = Math.max(12, Math.min(24, value || 16));
    setLocalSettings(prev => ({ ...prev, fontSize: clamped }));
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={handleCancel}>
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="space-y-6 py-4">
          {/* 段落数 */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-3 block">
              每次输出段落数
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={localSettings.paragraphsPerMessage}
                onChange={(e) => handleParagraphsChange(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <Input
                type="number"
                min="1"
                max="10"
                value={localSettings.paragraphsPerMessage}
                onChange={(e) => handleParagraphsChange(Number(e.target.value))}
                className="w-16 text-center"
              />
            </div>
          </div>

          {/* 打字速度 */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-3 block">
              打字速度 <span className="text-zinc-400 font-normal">（{localSettings.typingSpeed} 字/秒）</span>
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400">慢</span>
              <input
                type="range"
                min="5"
                max="50"
                value={localSettings.typingSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <span className="text-xs text-zinc-400">快</span>
            </div>
          </div>

          {/* 字体大小 */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-3 block">
              字体大小 <span className="text-zinc-400 font-normal">（{localSettings.fontSize}px）</span>
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400">小</span>
              <input
                type="range"
                min="12"
                max="24"
                value={localSettings.fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <span className="text-xs text-zinc-400">大</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSave}>
              完成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
