'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 모바일 기기에서만 표시 (PC는 표시 안 함)
    if (!window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    // 이미 설치된 경우 프롬프트 표시 안 함
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // 이전에 닫았는지 확인 (24시간 동안 표시 안 함)
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 설치 프롬프트 표시
    await deferredPrompt.prompt();

    // 사용자 선택 결과 확인
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] 설치 프롬프트 결과: ${outcome}`);

    // 상태 초기화
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      console.log('[PWA] 사용자가 앱 설치를 승인했습니다.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className="relative overflow-hidden rounded-lg border border-emerald-600/50 bg-slate-800 p-4 shadow-lg shadow-emerald-600/20">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent" />

        {/* 내용 */}
        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-600/20 p-2">
                <Download className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">앱으로 설치</h3>
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

          <p className="mb-4 text-sm text-slate-300">
            홈 화면에 추가하여 더 빠르고 편리하게 이용하세요
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              설치
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              나중에
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
