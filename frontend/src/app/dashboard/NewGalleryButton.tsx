import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function NewGalleryButton() {
  return (
    <Button
      asChild
      variant="outline"
      className="ml-auto relative h-9 overflow-hidden rounded-md border-transparent bg-transparent p-0 group"
    >
      <NavLink
        viewTransition
        to="/galleries/new"
        className="relative inline-flex items-center gap-2 rounded-md bg-background px-3 py-2"
      >
        {/* Gradient border layer (always animates slowly) */}
        <span
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-md
            p-[1px] opacity-85 transition-all duration-500
            motion-safe:animate-hue group-hover:motion-safe:animate-hue-fast
          "
          style={{
            background:
              'conic-gradient(from 0deg, #a78bfa, #22d3ee, #34d399, #a78bfa)',
          }}
        />
        {/* Inner mask (creates the border; thickens on hover) */}
        <span
          aria-hidden
          className="absolute inset-[1px] rounded-md bg-background transition-all duration-500 group-hover:inset-[2px]"
        />
        {/* Content */}
        <Sparkles className="relative h-4 w-4" />
        <span className="relative">New Gallery</span>
      </NavLink>
    </Button>
  );
}
