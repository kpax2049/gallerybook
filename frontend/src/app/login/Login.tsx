import { Link } from 'react-router-dom';
import heroArt from '@/assets/login-photo-albums-hero.png';
import logoMint from '@/assets/GB-logo-mint.png';
import logoTeal from '@/assets/GB-logo-teal.png';
import { cn } from '@/lib/utils';

type Props = {
  children?: React.ReactNode;
};

export default function LoginPage({ children }: Props) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#130d08] text-white">
      <img
        src={heroArt}
        alt="Pixel art desk with photo albums, framed landscapes, portraits, plants, and camera gear"
        className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,7,3,.82)_0%,rgba(16,9,4,.64)_39%,rgba(16,9,4,.22)_72%,rgba(16,9,4,.04)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />

      <header className="relative z-20 flex items-center justify-between px-5 py-[14px] sm:px-8">
        <Link to="/login" className="gb-brand" aria-label="Gallery Book login">
          <span className="gb-brand-mark" aria-hidden="true">
            <img
              src={logoTeal}
              alt=""
              width={40}
              height={40}
              className="gb-brand-logo gb-brand-logo--teal"
            />
            <img
              src={logoMint}
              alt=""
              width={40}
              height={40}
              className="gb-brand-logo gb-brand-logo--mint"
            />
          </span>
          <span className="gb-wordmark">
            <span className="gb-wordmark-gallery text-white">Gallery</span>
            <span className="gb-wordmark-book">Book</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-white/78">
          <span className="hidden sm:inline">New here?</span>
          <Link
            to="/signup"
            viewTransition
            className="rounded-full border border-white/24 bg-black/18 px-4 py-2 font-medium text-white backdrop-blur transition hover:bg-white/12"
          >
            Create account
          </Link>
        </div>
      </header>

      <main className="relative z-10 grid min-h-[calc(100svh-84px)] grid-cols-1 items-end gap-8 px-5 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_430px_minmax(96px,0.33fr)] lg:items-center lg:pb-12">
        <p className="gb-hand order-2 max-w-xl pb-2 text-[34px] font-semibold leading-none text-[#f8e9c8] drop-shadow-lg lg:order-1 lg:pb-14">
          Every picture has a place to live.
        </p>

        <section className="order-1 mx-auto w-full max-w-[430px] lg:order-2 lg:mx-0">
          <div
            className={cn(
              'gb-paper rotate-[-1.6deg] p-6 text-[var(--gb-paper-ink)] sm:p-7',
              'shadow-[0_28px_60px_-26px_rgba(0,0,0,.75)]'
            )}
          >
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
