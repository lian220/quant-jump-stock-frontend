'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Search, User, TrendingUp, Newspaper } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn, isActiveRoute } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/recommendations', label: '분석', icon: TrendingUp },
  { href: '/news', label: '뉴스', icon: Newspaper },
  { href: '/strategies', label: '전략', icon: BarChart3 },
  { href: '/stocks', label: '종목', icon: Search },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // 온보딩 페이지에서 하단 네비 숨김
  if (pathname === '/onboarding') return null;

  const myPageHref = user ? '/mypage' : '/auth';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center h-14">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = isActiveRoute(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive ? 'text-emerald-400' : 'text-slate-500',
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-0.5">{label}</span>
            </Link>
          );
        })}

        {/* MY 메뉴 */}
        <Link
          href={myPageHref}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full transition-colors',
            isActiveRoute(pathname, '/mypage') || isActiveRoute(pathname, '/auth')
              ? 'text-emerald-400'
              : 'text-slate-500',
          )}
        >
          <User size={20} />
          <span className="text-[10px] mt-0.5">MY</span>
        </Link>
      </div>
    </nav>
  );
}
