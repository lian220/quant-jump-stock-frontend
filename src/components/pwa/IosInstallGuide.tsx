'use client';

import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IOS_DISMISS_KEY = 'ios-install-dismissed';
const SNOOZE_DAYS = 7;

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPhone, iPad, iPod 감지 (iPad는 iOS 13+에서 macOS UA 사용)
  return /iPhone|iPad|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
}

function isStandalone(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iOS Safari standalone 모드 확인
  return (
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function isSnoozed(): boolean {
  const dismissed = localStorage.getItem(IOS_DISMISS_KEY);
  if (!dismissed) return false;
  const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
  return daysSince < SNOOZE_DAYS;
}

export function IosInstallGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIosDevice()) return;
    if (isStandalone()) return;
    if (isSnoozed()) return;
    setShow(true);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(IOS_DISMISS_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96">
      <div className="relative overflow-hidden rounded-lg border border-emerald-600/50 bg-slate-800 p-4 shadow-lg shadow-emerald-600/20">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent" />

        {/* 내용 */}
        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-600/20 p-2">
                <Share className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">홈 화면에 추가</h3>
                <p className="text-sm text-slate-400">Alpha Foundry</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-3 text-sm text-slate-300">
            홈 화면에 추가하면 앱처럼 빠르게 접속할 수 있어요
          </p>

          <div className="mb-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/30 text-xs font-bold text-emerald-400">
                1
              </span>
              <span>
                하단 공유 버튼 <span className="inline-block text-base leading-none">⎋</span> 탭
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/30 text-xs font-bold text-emerald-400">
                2
              </span>
              <span>&quot;홈 화면에 추가&quot; 선택</span>
            </div>
          </div>

          <Button
            onClick={handleDismiss}
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
