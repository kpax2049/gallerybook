import * as React from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { replaceTags } from '@/api/gallery';
import { cn } from '@/lib/utils';

export type InlineTagsEditorHandle = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

type Props = {
  galleryId: number;
  initial: string[];
  onUpdated?: (next: string[]) => void;
  maxVisible?: number;
  editable?: boolean;
  /** NEW: when false, no inline row is rendered (headless) */
  renderTriggerRow?: boolean;
  anchorRef?: React.RefObject<HTMLElement | null>;
};

export const InlineTagsEditor = React.forwardRef<InlineTagsEditorHandle, Props>(
  (
    {
      galleryId,
      initial,
      onUpdated,
      maxVisible = 3,
      editable = true,
      renderTriggerRow = true, // default current behavior
      anchorRef,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [q, setQ] = React.useState('');
    const rowRef = React.useRef<HTMLDivElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [tags, setTags] = React.useState<string[]>(initial ?? []);
    const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties>();

    const getAnchorRect = React.useCallback(() => {
      const el = rowRef.current ?? anchorRef?.current; // prefer row; fall back to card
      return el?.getBoundingClientRect() ?? null;
    }, [anchorRef]);

    const updatePos = React.useCallback(() => {
      const r = getAnchorRect();
      if (!r) return;

      const vw = window.innerWidth;
      const width = Math.min(r.width, vw - 16); // keep inside viewport with 8px gutters
      const left = Math.min(Math.max(8, r.left), vw - width - 8);
      const top = r.bottom + 6; // place just under the card/row

      setPortalStyle({ position: 'fixed', left, top, width, zIndex: 1000 });
    }, [getAnchorRect]);

    React.useEffect(() => {
      if (!open) return;
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }, [open, updatePos]);

    const tagsRef = React.useRef(tags);
    React.useEffect(() => {
      tagsRef.current = tags;
    }, [tags]);

    // expose imperative controls
    React.useImperativeHandle(
      ref,
      () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen((o) => !o),
      }),
      []
    );

    // sync from props only when closed
    React.useEffect(() => {
      if (!open) setTags(Array.isArray(initial) ? initial : []);
    }, [initial, open]);

    // outside click -> close
    React.useEffect(() => {
      if (!open) return;
      const onDocDown = (e: MouseEvent) => {
        const t = e.target as Node;
        if (panelRef.current?.contains(t)) return;
        if (rowRef.current?.contains?.(t)) return;
        setOpen(false);
      };
      document.addEventListener('mousedown', onDocDown, { capture: true });
      return () =>
        document.removeEventListener('mousedown', onDocDown, { capture: true });
    }, [open]);

    // // portal placement (fixed, above everything)
    // const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties>();
    // const updatePos = React.useCallback(() => {
    //   // position under the trigger row if present; otherwise center under the card width if known
    //   const r = rowRef.current?.getBoundingClientRect();
    //   const vw = window.innerWidth;
    //   const width = Math.min(r?.width ?? 360, vw - 16);
    //   const left = Math.min(Math.max(8, r?.left ?? 8), vw - width - 8);
    //   const top = (r?.bottom ?? 0) + 6 || 100; // fallback if no row
    //   setPortalStyle({ position: 'fixed', left, top, width, zIndex: 1000 });
    // }, []);
    // React.useEffect(() => {
    //   if (!open) return;
    //   updatePos();
    //   window.addEventListener('resize', updatePos);
    //   window.addEventListener('scroll', updatePos, true);
    //   return () => {
    //     window.removeEventListener('resize', updatePos);
    //     window.removeEventListener('scroll', updatePos, true);
    //   };
    // }, [open, updatePos]);

    const commit = async (next: string[]) => {
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
      } finally {
        setSaving(false);
        setQ('');
      }
    };

    const add = () => {
      if (!editable) return;
      const t = q.trim().replace(/\s+/g, ' ');
      if (!t) return;
      setQ('');
      const prev = tagsRef.current;
      if (prev.some((x) => x.toLowerCase() === t.toLowerCase())) return;
      const next = [...prev, t];
      setTags(next);
      void commit(next);
    };
    const remove = (t: string) => {
      if (!editable) return;
      const prev = tagsRef.current;
      const next = prev.filter((x) => x.toLowerCase() !== t.toLowerCase());
      if (next.length === prev.length) return;
      setTags(next);
      void commit(next);
    };

    const visible = tags.slice(0, maxVisible);
    const overflow = Math.max(0, tags.length - visible.length);

    return (
      <>
        {/* Inline trigger row: render only when requested (default) */}
        {renderTriggerRow && (
          <div
            className="relative w-full"
            data-stop-link={editable ? 'true' : undefined}
          >
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
                <Badge
                  key={t}
                  variant="secondary"
                  className="shrink-0 max-w-[45%]"
                >
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
            </div>
          </div>
        )}

        {/* Headless popover rendered to body, only when open */}
        {editable &&
          open &&
          portalStyle &&
          createPortal(
            <div
              ref={panelRef}
              style={portalStyle}
              className="fixed rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!saving) add();
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
                >
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);
InlineTagsEditor.displayName = 'InlineTagsEditor';
