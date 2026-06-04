import logo from '@/assets/GB-logo.png';
import heroArt from '@/assets/login-photo-albums-hero.webp';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';

type Props = {
  children?: React.ReactNode;
};

function AppLogo({
  className,
  imageClassName,
  showText = true,
}: {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background p-1 shadow-sm">
        <img
          className={cn('h-full w-full object-contain', imageClassName)}
          src={logo}
          alt="Logo"
        />
      </span>
      {showText && (
        <span className="text-sm font-semibold uppercase tracking-[0.18em]">
          Gallery Book
        </span>
      )}
    </div>
  );
}

export default function LoginPage({ children }: Props) {
  return (
    <div className="min-h-svh overflow-hidden bg-background text-foreground">
      <div className="relative min-h-svh">
        <img
          src={heroArt}
          alt="Pixel art desk with photo albums, framed landscapes, portraits, plants, and camera gear"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/58 to-background/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/45" />
        <div className="absolute inset-x-0 top-0 h-24 border-b border-white/10 bg-background/20 backdrop-blur-sm" />

        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <AppLogo className="rounded-lg bg-background/70 pr-3 shadow-sm backdrop-blur" />
          <ModeToggle />
        </header>

        <main className="relative z-10 mx-auto grid min-h-[calc(100svh-76px)] w-full max-w-7xl items-end gap-8 px-4 pb-4 pt-8 md:px-8 md:pb-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
          <section className="max-w-2xl pb-4 text-background dark:text-foreground lg:pb-20">
            <div className="mb-5 inline-flex rounded-full border border-white/30 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-sm backdrop-blur">
              Personal photo galleries
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-normal text-white drop-shadow-md md:text-6xl">
              Share photos with a little more context.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/82 drop-shadow md:text-lg">
              Gallery Book is a small hobby web app for collecting photos into
              galleries and adding the stories that make them worth revisiting.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white">
              <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 backdrop-blur">
                galleries
              </span>
              <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 backdrop-blur">
                stories
              </span>
              <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 backdrop-blur">
                albums
              </span>
              <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 backdrop-blur">
                comments
              </span>
            </div>
          </section>

          <section className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="relative overflow-hidden rounded-lg border border-white/20 bg-[#0f0d0b]/82 p-5 text-white shadow-2xl shadow-black/45 backdrop-blur-md md:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_12%,rgba(255,232,190,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.28))]" />
              <div className="pointer-events-none absolute inset-3 rounded-md border border-white/20" />
              <span className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-4 border-t-4 border-white/55" />
              <span className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-4 border-t-4 border-white/55" />
              <span className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-4 border-l-4 border-white/55" />
              <span className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-4 border-r-4 border-white/55" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/45" />
              <div className="pointer-events-none absolute right-0 top-0 h-14 w-14 border-b border-l border-white/20 bg-white/18 shadow-sm [clip-path:polygon(100%_0,0_0,100%_100%)]" />
              <div className="relative">{children}</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
