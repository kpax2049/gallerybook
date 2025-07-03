'use client';

import {
  Dropzone,
  DropZoneArea,
  //   DropzoneDescription,
  //   DropzoneFileList,
  //   DropzoneFileListItem,
  //   DropzoneFileMessage,
  DropzoneTrigger,
  DropzoneMessage,
  //   DropzoneRemoveFile,
  //   DropzoneRetryFile,
  //   InfiniteProgress,
  useDropzone,
} from '@/components/ui/dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getUserFullName } from '@/api/user';
import { useUserStore } from '@/stores/userStore';

export function AvatarUpload() {
  const currentUser = useUserStore((state) => state.user);
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        status: 'success',
        result: URL.createObjectURL(file),
      };
    },
    validation: {
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg'],
      },
      maxSize: 1024 * 1024,
      maxFiles: 1,
    },
    shiftOnMaxFiles: true,
  });

  const avatarSrc = dropzone.fileStatuses[0]?.result;
  const isPending = dropzone.fileStatuses[0]?.status === 'pending';
  return (
    <Dropzone {...dropzone}>
      <div className="flex justify-between">
        <DropzoneMessage />
      </div>
      <DropZoneArea className="border-none justify-between">
        <DropzoneTrigger className="flex gap-20 justify-between bg-transparent text-sm">
          <Avatar className={cn(isPending && 'animate-pulse')}>
            <AvatarImage className="object-cover" src={avatarSrc} />
            <AvatarFallback>{getUserFullName(currentUser)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 font-semibold">
            <p>Upload a new avatar</p>
            <p className="text-xs text-muted-foreground">Size limit is 1MB</p>
          </div>
        </DropzoneTrigger>
      </DropZoneArea>
    </Dropzone>
  );
}
