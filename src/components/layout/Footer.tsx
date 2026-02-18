'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HIDDEN_PATHS = ['/auth', '/onboarding', '/offline'];

export function Footer() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 링크 섹션 */}
        <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
          <Link href="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors">
            개인정보처리방침
          </Link>
          <Link
            href="/disclaimer"
            className="text-slate-400 hover:text-emerald-400 transition-colors"
          >
            투자 유의사항
          </Link>
        </div>

        {/* 메인 텍스트 */}
        <div className="text-center text-slate-500">
          <p className="mb-2 font-medium">Alpha Foundry - AI 기반 주식 데이터 분석 플랫폼</p>
          <p className="text-sm mb-4">
            &copy; 2025-{new Date().getFullYear()} Alpha Foundry. All rights reserved.
          </p>

          {/* 면책 조항 강화 */}
          <div className="max-w-3xl mx-auto space-y-2 border-t border-slate-800 pt-4 mt-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-yellow-500/70">
                본 서비스는 금융투자업(투자자문업, 투자일임업)이 아닌 정보 제공 서비스입니다.
              </strong>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              제공되는 모든 정보는 투자 참고 자료일 뿐이며, 투자 자문이나 매매 권유가 아닙니다. AI
              분석 결과는 과거 데이터 기반이며 미래 수익을 보장하지 않습니다. 투자에 대한 최종 결정
              및 손실 책임은 투자자 본인에게 있습니다.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
