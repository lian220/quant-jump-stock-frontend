'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BarChart3, Search, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/strategies', label: '전략', icon: BarChart3 },
  { href: '/stocks', label: '종목', icon: Search },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const myPageHref = user ? '/mypage' : '/auth';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center h-14">
        {/* 뒤로가기 - 왼쪽 독립 배치 */}
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-14 h-full text-slate-400 active:text-slate-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* 메뉴 아이템 - 오른쪽 균등 배치 */}
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
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
            pathname === '/mypage' || pathname === '/auth' ? 'text-emerald-400' : 'text-slate-500',
          )}
        >
          <User size={20} />
          <span className="text-[10px] mt-0.5">MY</span>
        </Link>
      </div>
    </nav>
  );
}
