import { Images } from 'lucide-react';

type Props = {
  children?: React.ReactNode;
};

export default function LoginPage({ children }: Props) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Images className="size-4 bg-primary" />
          </div>
          Gallery Book
        </a>
        {children}
      </div>
    </div>
  );
}
