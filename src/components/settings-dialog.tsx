'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type SpeedLevel = 'slow' | 'medium' | 'fast';

export interface Settings {
  paragraphsPerMessage: number;
  speed: SpeedLevel;
}

export const SPEED_DELAYS: Record<SpeedLevel, number> = {
  slow: 50,
  medium: 30,
  fast: 10,
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const handleParagraphsChange = (value: number) => {
    const clamped = Math.max(1, Math.min(10, value || 1));
    onSettingsChange({ ...settings, paragraphsPerMessage: clamped });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 段落数 - 滑动条 + 输入框 */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-3 block">
              每次输出段落数
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={settings.paragraphsPerMessage}
                onChange={(e) => handleParagraphsChange(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.paragraphsPerMessage}
                onChange={(e) => handleParagraphsChange(Number(e.target.value))}
                className="w-16 text-center"
              />
            </div>
          </div>

          {/* 打字速度 */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-3 block">
              打字速度
            </label>
            <div className="flex gap-2">
              {[
                { value: 'slow' as SpeedLevel, label: '慢' },
                { value: 'medium' as SpeedLevel, label: '中' },
                { value: 'fast' as SpeedLevel, label: '快' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onSettingsChange({ ...settings, speed: value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.speed === value
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
