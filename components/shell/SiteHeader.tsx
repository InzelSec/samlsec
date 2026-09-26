import { Logo } from './Logo';
import { MainNav } from './MainNav';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-30 border-b border-chrome-line bg-chrome">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <MainNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
