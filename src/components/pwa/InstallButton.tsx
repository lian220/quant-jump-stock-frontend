'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    if (!deferredPrompt) {
      // 설치 조건 미충족 시 안내 메시지
      const userAgent = navigator.userAgent.toLowerCase();
      let message = '앱 설치가 불가능합니다.\n\n';

      if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        message +=
          'Safari에서는 홈 화면 추가를 이용해주세요:\n1. 공유 버튼 탭\n2. "홈 화면에 추가" 선택';
      } else if (window.matchMedia('(display-mode: standalone)').matches) {
        message += '이미 앱이 설치되어 있습니다.';
      } else {
        message +=
          '다음 조건을 확인해주세요:\n- Chrome, Edge, Samsung Internet 브라우저 사용\n- HTTPS 연결\n- 이미 설치되지 않은 상태';
      }

      alert(message);
      return;
    }

    // 설치 프롬프트 표시
    await deferredPrompt.prompt();

    // 사용자 선택 결과 확인
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] 수동 설치 프롬프트 결과: ${outcome}`);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    // 상태 초기화
    setDeferredPrompt(null);
  };

  // 이미 설치된 경우에만 버튼 숨김
  if (isInstalled) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      className={`border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/10 ${compact ? 'h-9 w-9' : 'gap-2'} ${className}`}
      title={compact ? '앱 설치' : undefined}
    >
      <Download className="h-4 w-4" />
      {!compact && '앱 설치'}
    </Button>
  );
}
