'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false, // 탭 전환 시 자동 재요청 안 함
        revalidateOnReconnect: true, // 네트워크 복구 시 갱신
        dedupingInterval: 5000, // 5초 내 중복 요청 방지 (기본값)
        errorRetryCount: 2, // 에러 시 2회 재시도
      }}
    >
      {children}
    </SWRConfig>
  );
}
