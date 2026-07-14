import type { ReactNode } from 'react';

import { publicPageHeroes, type PublicPageHeroKey } from '@/config/public-page-heroes';
import { cn } from '@/lib/class-names';
import SubpageHero from './SubpageHero';

type PublicSubpageShellProps = {
  heroKey: PublicPageHeroKey;
  children: ReactNode;
  className?: string;
};

export default function PublicSubpageShell({
  heroKey,
  children,
  className,
}: PublicSubpageShellProps) {
  return (
    <main className={cn('relative flex min-h-screen flex-col bg-transparent', className)}>
      <SubpageHero slides={publicPageHeroes[heroKey]} />
      {children}
    </main>
  );
}

