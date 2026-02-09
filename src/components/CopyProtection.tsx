'use client';

import { useEffect } from 'react';

export function CopyProtection() {
  useEffect(() => {
    // 복사 방지
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // 잘라내기 방지
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // 우클릭 메뉴 방지
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 이벤트 리스너 등록
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);

    // 클린업
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null;
}
