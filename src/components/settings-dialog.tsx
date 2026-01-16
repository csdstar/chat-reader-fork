'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 段落数 */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-3 block">
              每次输出段落数
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => onSettingsChange({ ...settings, paragraphsPerMessage: n })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.paragraphsPerMessage === n
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {n}
                </button>
              ))}
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
