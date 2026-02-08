'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstallButton } from '@/components/pwa/InstallButton';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // 모바일 메뉴 열렸을 때 body 스크롤 막기
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex md:grid md:grid-cols-3 items-center justify-between py-4">
          {/* 왼쪽: 로고 */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/main_logo.png"
                alt="Alpha Foundry Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer">
                Alpha Foundry
              </h1>
            </Link>
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
            >
              BETA
            </Badge>
          </div>

          {/* 중앙: 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center justify-center space-x-6">
            <Link
              href="/strategies"
              className={`inline-flex items-center transition-colors font-medium ${
                isActive('/strategies')
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              전략 마켓플레이스
            </Link>
            <Link
              href="/stocks"
              className={`inline-flex items-center transition-colors font-medium ${
                isActive('/stocks') ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              종목 탐색
            </Link>
            <Link
              href="/#features"
              className={`inline-flex items-center transition-colors font-medium ${
                isActive('/#features')
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              기능
            </Link>
            <Link
              href="/#pricing"
              className={`inline-flex items-center transition-colors font-medium ${
                isActive('/#pricing') ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              요금제
            </Link>
            {/* 네비 옆 작은 설치 버튼 */}
            <div className="pl-2 border-l border-slate-700">
              <InstallButton compact />
            </div>
          </nav>

          {/* 오른쪽: 사용자 정보/로그인 */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-sm text-slate-400 hidden lg:inline truncate max-w-[150px]">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hidden md:flex"
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <Link href="/auth" className="hidden md:block">
                <Button
                  variant="outline"
                  size="default"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  로그인
                </Button>
              </Link>
            )}

            {/* 모바일: 앱 설치 버튼 + 메뉴 버튼 */}
            <div className="flex items-center space-x-2 md:hidden">
              <InstallButton compact />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
                aria-label="메뉴"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700 py-6 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4">
              <Link
                href="/strategies"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-semibold transition-all py-3 px-4 rounded-lg ${
                  isActive('/strategies')
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
                }`}
              >
                전략 마켓플레이스
              </Link>
              <Link
                href="/stocks"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-semibold transition-all py-3 px-4 rounded-lg ${
                  isActive('/stocks')
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
                }`}
              >
                종목 탐색
              </Link>
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold transition-all py-3 px-4 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
              >
                기능
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold transition-all py-3 px-4 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
              >
                요금제
              </Link>

              {/* 모바일 사용자 정보 */}
              {user ? (
                <div className="pt-4 border-t border-slate-700 space-y-3">
                  <div className="px-4 py-2">
                    <span className="text-sm text-slate-400 block truncate">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-red-500/50 transition-all"
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-700">
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-emerald-500/50 transition-all"
                    >
                      로그인
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
