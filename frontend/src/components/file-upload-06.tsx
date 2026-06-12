import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  FileImage,
  ImagePlus,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadItemStatus = 'ready' | 'inserting' | 'error';

type UploadItem = {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  progress: number;
  status: UploadItemStatus;
  error?: string;
};

type ImageUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (files: File[]) => Promise<void>;
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileError = (file: File) => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, GIF, and WEBP images are supported.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Image must be 10 MB or smaller.';
  }

  return undefined;
};

export function ImageUploadDialog({
  open,
  onOpenChange,
  onInsert,
}: ImageUploadDialogProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [insertError, setInsertError] = useState<string | null>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((upload) =>
        URL.revokeObjectURL(upload.previewUrl)
      );
    };
  }, []);

  const validUploads = useMemo(
    () => uploads.filter((upload) => upload.status !== 'error'),
    [uploads]
  );
  const invalidUploads = useMemo(
    () => uploads.filter((upload) => upload.status === 'error'),
    [uploads]
  );
  const inserting = uploads.some((upload) => upload.status === 'inserting');

  const resetUploads = useCallback(() => {
    setInsertError(null);
    setUploads((currentUploads) => {
      currentUploads.forEach((upload) =>
        URL.revokeObjectURL(upload.previewUrl)
      );
      return [];
    });
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !inserting) {
        resetUploads();
      }

      onOpenChange(nextOpen);
    },
    [inserting, onOpenChange, resetUploads]
  );

  const addFiles = useCallback((files: FileList | File[]) => {
    const nextUploads = Array.from(files).map((file) => {
      const error = getFileError(file);

      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        progress: error ? 0 : 100,
        status: error ? 'error' : 'ready',
        error,
      } satisfies UploadItem;
    });

    if (nextUploads.length === 0) return;

    setInsertError(null);
    setUploads((currentUploads) => [...currentUploads, ...nextUploads]);
  }, []);

  const openFilePicker = useCallback(() => {
    if (!inserting) filePickerRef.current?.click();
  }, [inserting]);

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = '';
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();
    if (!inserting && event.dataTransfer.files)
      addFiles(event.dataTransfer.files);
  };

  const removeUploadById = useCallback((id: string) => {
    setUploads((currentUploads) => {
      const removedUpload = currentUploads.find((upload) => upload.id === id);
      if (removedUpload) URL.revokeObjectURL(removedUpload.previewUrl);

      return currentUploads.filter((upload) => upload.id !== id);
    });
  }, []);

  const handleInsert = useCallback(async () => {
    const files = validUploads.map((upload) => upload.file);
    if (files.length === 0 || inserting) return;

    setInsertError(null);
    setUploads((currentUploads) =>
      currentUploads.map((upload) =>
        upload.status === 'ready'
          ? { ...upload, progress: 45, status: 'inserting' }
          : upload
      )
    );

    try {
      await onInsert(files);
      setUploads((currentUploads) =>
        currentUploads.map((upload) =>
          upload.status === 'inserting'
            ? { ...upload, progress: 100, status: 'ready' }
            : upload
        )
      );
      resetUploads();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to insert gallery images', error);
      setInsertError('Images could not be inserted. Try again.');
      setUploads((currentUploads) =>
        currentUploads.map((upload) =>
          upload.status === 'inserting'
            ? { ...upload, progress: 100, status: 'ready' }
            : upload
        )
      );
    }
  }, [inserting, onInsert, onOpenChange, resetUploads, validUploads]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Images</DialogTitle>
          <DialogDescription>
            Drop images here or browse files to insert them into this gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-6">
          <Card
            className={cn(
              'group flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-dashed py-8 text-sm shadow-none transition-colors hover:bg-muted/50',
              inserting && 'pointer-events-none opacity-60'
            )}
            onDragOver={onDragOver}
            onDrop={onDropFiles}
            onClick={openFilePicker}
          >
            <div className="flex items-center gap-x-2 text-muted-foreground">
              <Upload className="size-5" />
              <div>
                Drop images here or{' '}
                <span className="text-primary underline-offset-4 group-hover:underline">
                  browse files
                </span>{' '}
                to add
              </div>
            </div>
            <input
              ref={filePickerRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              multiple
              onChange={onFileInputChange}
            />
            <span className="block text-xs text-muted-foreground">
              JPG, PNG, GIF, WEBP up to 10 MB each
            </span>
          </Card>

          {uploads.length > 0 && (
            <div className="flex max-h-[320px] flex-col gap-y-4 overflow-y-auto pr-1">
              {validUploads.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center text-xs font-medium uppercase text-foreground">
                    {inserting ? (
                      <Loader2 className="mr-1 size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 size-4" />
                    )}
                    {inserting ? 'Inserting' : 'Ready'}
                  </h2>
                  <div className="-mt-2 divide-y">
                    {validUploads.map((upload) => (
                      <UploadListItem
                        key={upload.id}
                        upload={upload}
                        disabled={inserting}
                        onRemove={removeUploadById}
                      />
                    ))}
                  </div>
                </div>
              )}

              {validUploads.length > 0 && invalidUploads.length > 0 && (
                <Separator className="my-0" />
              )}

              {invalidUploads.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center text-xs font-medium uppercase text-destructive">
                    Needs attention
                  </h2>
                  <div className="-mt-2 divide-y">
                    {invalidUploads.map((upload) => (
                      <UploadListItem
                        key={upload.id}
                        upload={upload}
                        disabled={inserting}
                        onRemove={removeUploadById}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {insertError && (
            <p className="text-sm text-destructive" role="alert">
              {insertError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={inserting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            disabled={validUploads.length === 0 || inserting}
          >
            {inserting
              ? 'Inserting...'
              : validUploads.length > 0
                ? `Insert ${validUploads.length}`
                : 'Insert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type UploadListItemProps = {
  upload: UploadItem;
  disabled: boolean;
  onRemove: (id: string) => void;
};

function UploadListItem({ upload, disabled, onRemove }: UploadListItemProps) {
  const isError = upload.status === 'error';

  return (
    <div className="group flex items-center py-4">
      <div className="mr-3 grid size-12 shrink-0 place-content-center overflow-hidden rounded-lg border bg-muted">
        {isError ? (
          <FileImage className="size-5 text-muted-foreground" />
        ) : (
          <img
            src={upload.previewUrl}
            alt=""
            className="size-12 object-cover"
            draggable={false}
          />
        )}
      </div>
      <div className="mb-1 flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-2">
          <span className="truncate text-sm text-foreground">
            {upload.name}
          </span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formatFileSize(upload.file.size)}
          </span>
        </div>
        {upload.error ? (
          <span className="mt-1 text-xs text-destructive">{upload.error}</span>
        ) : (
          <Progress value={upload.progress} className="mt-2 h-2" />
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-2 size-8"
        onClick={() => onRemove(upload.id)}
        aria-label={`Remove ${upload.name}`}
        disabled={disabled}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

export function ImageUploadButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={onClick}
      disabled={disabled}
      title="Add images"
      aria-label="Add images"
    >
      <ImagePlus className="size-4" />
    </Button>
  );
}
