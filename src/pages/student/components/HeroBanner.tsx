import { ArrowRight } from 'lucide-react';

import heroBanner from '@/assets/hero-banner.png';
import { Button } from '@/components/ui/button';

interface HeroBannerProps {
  name: string;
  onStart?: () => void;
}

/** Hero banner: a designer-supplied background (gradient + clouds + cap-and-books illustration
 * already baked in, see src/assets/hero-banner.png) with the real greeting text overlaid on its
 * plain left side — no hand-drawn decoration needed anymore. */
export function HeroBanner({ name, onStart }: HeroBannerProps) {
  return (
    <div className="relative aspect-[1800/260] w-full overflow-hidden rounded-card shadow-card">
      <img src={heroBanner} alt="" className="absolute inset-0 h-full w-full object-cover" />

      <div className="absolute inset-0 flex items-center">
        <div className="max-w-md px-5 sm:px-7">
          <h2 className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
            Xin chào, {name}!
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
            Cùng khám phá hành trình tri thức của bạn nhé!
          </p>
          <Button onClick={onStart} className="mt-3.5 font-bold tracking-wide shadow-card">
            Bắt đầu học ngay
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
