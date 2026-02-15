'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallButtonProps {
  compact?: boolean; // 아이콘만 표시 (네비바용)
  className?: string;
}

export function InstallButton({ compact = false, className = '' }: InstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 체크
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt 이벤트 캐치
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();

      // 사용자 선택 결과 확인
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] 수동 설치 프롬프트 결과: ${outcome}`);

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('[PWA] 설치 프롬프트 오류:', error);
    } finally {
      // 상태 초기화
      setDeferredPrompt(null);
    }
  };

  // 이미 설치되었거나, 설치 프롬프트를 지원하지 않는 환경(PC 브라우저 등)에서는 숨김
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      className={cn(
        'border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/10',
        compact ? 'h-9 w-9' : 'gap-2',
        className,
      )}
      title={compact ? '앱 설치' : undefined}
    >
      <Download className="h-4 w-4" />
      {!compact && '앱 설치'}
    </Button>
  );
}
