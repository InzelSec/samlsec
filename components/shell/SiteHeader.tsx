import { Logo } from './Logo';
import { MainNav } from './MainNav';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
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
