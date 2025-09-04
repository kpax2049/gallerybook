import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
  label?: string; // optional visible label
  placeholder?: string;
  disabled?: boolean;
};

export function TagField({
  value,
  onChange,
  className,
  label = 'Tags',
  placeholder = 'Add a tag…',
  disabled,
}: Props) {
  const [q, setQ] = React.useState('');

  const add = React.useCallback(() => {
    const t = q.trim().replace(/\s+/g, ' ');
    if (!t) return;
    setQ('');
    const exists = value.some((x) => x.toLowerCase() === t.toLowerCase());
    if (exists) return;
    onChange([...value, t]);
  }, [q, value, onChange]);

  const remove = React.useCallback(
    (t: string) => {
      onChange(value.filter((x) => x.toLowerCase() !== t.toLowerCase()));
    },
    [value, onChange]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-medium">{label}</div>

      {/* current tags */}
      <div className="flex flex-wrap gap-1">
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">No tags yet</span>
        ) : (
          value.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              <span className="max-w-[16rem] truncate">{t}</span>
              <button
                type="button"
                title="Remove"
                className="ml-1 opacity-70 hover:opacity-100"
                onClick={() => remove(t)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* add new */}
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-9"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!disabled) add();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={add}
          disabled={disabled || !q.trim()}
        >
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
