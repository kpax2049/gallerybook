import * as React from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { replaceTags } from '@/api/gallery';

type Props = {
  galleryId: number;
  initial: string[];
  onUpdated?: (next: string[]) => void;
  maxVisible?: number;
  editable?: boolean;
};

export function InlineTagsEditor({
  galleryId,
  initial,
  onUpdated,
  maxVisible = 3,
  editable = true,
}: Props) {
  const [tags, setTags] = React.useState<string[]>(initial ?? []);
  const tagsRef = React.useRef(tags);
  React.useEffect(() => {
    tagsRef.current = tags;
  }, [tags]);

  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // Only sync from props when editor is CLOSED
  React.useEffect(() => {
    if (!open) setTags(Array.isArray(initial) ? initial : []);
  }, [initial, open]);

  // Close on outside click (only when editable & open)
  React.useEffect(() => {
    if (!editable || !open) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (rowRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown, { capture: true });
    return () =>
      document.removeEventListener('mousedown', onDocDown, { capture: true });
  }, [editable, open]);

  const commit = React.useCallback(
    async (next: string[]) => {
      setSaving(true);
      try {
        const res = await replaceTags(galleryId, next);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const final = Array.isArray((res as any)?.tags)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (res as any).tags
          : next;
        setTags(final);
        onUpdated?.(final);
      } catch (e) {
        console.error('replaceTags failed', e);
      } finally {
        setSaving(false);
        setQ('');
      }
    },
    [galleryId, onUpdated]
  );

  const add = React.useCallback(() => {
    if (!editable) return;
    const t = q.trim().replace(/\s+/g, ' ');
    if (!t) return;
    setQ('');
    const prev = tagsRef.current;
    if (prev.some((x) => x.toLowerCase() === t.toLowerCase())) return; // de-dupe
    const next = [...prev, t];
    setTags(next);
    void commit(next);
  }, [q, commit, editable]);

  const remove = React.useCallback(
    (t: string) => {
      if (!editable) return;
      const prev = tagsRef.current;
      const next = prev.filter((x) => x.toLowerCase() !== t.toLowerCase());
      if (next.length === prev.length) return;
      setTags(next);
      void commit(next);
    },
    [commit, editable]
  );

  const visible = tags.slice(0, maxVisible);
  const overflow = Math.max(0, tags.length - visible.length);

  return (
    <div
      className="relative w-full"
      // only block card navigation when editable
      data-stop-link={editable ? 'true' : undefined}
    >
      {/* Trigger / read-only row */}
      <div
        ref={rowRef}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : -1}
        className={cn(
          'flex h-[28px] w-full min-w-0 items-center gap-1 overflow-hidden rounded-sm',
          editable
            ? 'hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            : 'cursor-default'
        )}
        title={
          editable
            ? tags.length
              ? 'Edit tags'
              : 'Add tags'
            : tags.length
              ? 'Tags'
              : 'No tags'
        }
        onClick={editable ? () => setOpen(true) : undefined}
        onKeyDown={
          editable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen(true);
                }
              }
            : undefined
        }
      >
        {visible.map((t) => (
          <Badge key={t} variant="secondary" className="shrink-0 max-w-[45%]">
            <span className="block max-w-full truncate">{t}</span>
          </Badge>
        ))}
        {overflow > 0 && (
          <Badge variant="outline" className="shrink-0">
            +{overflow}
          </Badge>
        )}
        {tags.length === 0 && (
          <span className="text-[11px] text-muted-foreground">
            {editable ? 'Add tags…' : 'No tags'}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <TagIcon className="h-3.5 w-3.5" />
          {editable ? (tags.length ? 'Edit' : 'Add') : 'Tags'}
        </span>
      </div>

      {/* Floating panel: only when editable */}
      {editable && open && (
        <div
          ref={panelRef}
          className={cn(
            'absolute left-0 right-0 top-full z-[1000] mt-1',
            'rounded-md border bg-popover p-3 text-popover-foreground shadow-md'
          )}
          data-stop-link="true"
        >
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No tags yet.
              </span>
            ) : (
              tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  <span className="max-w-[16rem] truncate">{t}</span>
                  <button
                    className="ml-1 opacity-70 hover:opacity-100"
                    title="Remove"
                    onClick={() => !saving && remove(t)}
                    disabled={saving}
                    data-stop-link="true"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="New tag…"
              className="h-8"
              disabled={saving}
              data-stop-link="true"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!saving) void add();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => !saving && add()}
              disabled={saving || !q.trim()}
              data-stop-link="true"
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
