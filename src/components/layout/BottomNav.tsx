'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BarChart3, Search, User, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/recommendations', label: '분석', icon: TrendingUp },
  { href: '/strategies', label: '전략', icon: BarChart3 },
  { href: '/stocks', label: '종목', icon: Search },
] as const;

// 메인 탭 경로 (뒤로가기 미표시)
const mainPaths = ['/', '/recommendations', '/strategies', '/stocks', '/mypage', '/auth'];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const myPageHref = user ? '/mypage' : '/auth';
  const isDetailPage = !mainPaths.includes(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center h-14">
        {/* 뒤로가기 - 상세 페이지에서만 표시 */}
        {isDetailPage && (
          <button
            onClick={() => router.back()}
            className="flex flex-col items-center justify-center w-12 h-full text-slate-400 active:text-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-[10px] mt-0.5">뒤로</span>
          </button>
        )}

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
