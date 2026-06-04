import type React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ThemeOption = {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const options: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-grid grid-cols-3 gap-1 rounded-lg border bg-background p-1 shadow-sm"
      aria-label="Theme"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${option.label} theme`}
                aria-pressed={active}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
