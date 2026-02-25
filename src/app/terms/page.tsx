/* eslint-disable react/no-unescaped-entities */
/* eslint-disable prettier/prettier */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageSEO } from '@/components/seo';

export default function TermsPage() {
  return (
    <>
      <PageSEO
        title="이용약관 - Alpha Foundry"
        description="Alpha Foundry &quot;서비스&quot; 이용약관"
        noindex
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">이용약관</h1>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="prose prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제1조 (목적)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    본 약관은 Alpha Foundry(이하 "&quot;회사&quot;")가 제공하는 주식 데이터 분석
                    정보 제공 &quot;서비스&quot;(이하 "&quot;서비스&quot;")의 이용과 관련하여 &quot;회사&quot;와 이용자 간의
                    권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제2조 (&quot;서비스&quot;의 성격)</h2>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <p className="text-yellow-300 font-semibold mb-2">⚠️ 중요 고지</p>
                    <p className="text-slate-300 leading-relaxed">
                      본 &quot;서비스&quot;는 「자본시장과 금융투자업에 관한 법률」상 금융투자업(투자자문업,
                      투자일임업)에 해당하지 않으며, AI 알고리즘을 활용한{' '}
                      <strong className="text-white">데이터 분석 결과를 정보로 제공</strong>하는
                      플랫폼입니다.
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>
                      본 &quot;서비스&quot;는 투자 판단을 대행하거나 특정 종목의 매매를 권유하지 않습니다.
                    </li>
                    <li>
                      제공되는 모든 정보는 투자 참고 자료일 뿐이며, 투자 결정은 이용자 본인의
                      책임입니다.
                    </li>
                    <li>자동 매매 기능, 증권사 계좌 연동 기능을 제공하지 않습니다.</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제3조 (회원 가입)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    1. 이용자는 &quot;회사&quot;가 정한 절차에 따라 회원가입을 신청하고,
                    &quot;회사&quot;의 승인을 받아 회원이 됩니다.
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    2. 회원은 가입 시 제공한 정보가 정확하고 최신의 정보임을 보증해야 합니다.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제4조 (&quot;서비스&quot; 이용)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    1. &quot;서비스&quot;는 연중무휴 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검 등
                    필요한 경우 &quot;서비스&quot;를 일시 중단할 수 있습니다.
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    2. &quot;회사&quot;는 &quot;서비스&quot; 개선을 위해 기능을 추가하거나 변경할 수 있습니다.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제5조 (면책 조항)</h2>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <p className="text-red-300 font-semibold mb-2">🚨 투자 손실 면책</p>
                    <p className="text-slate-300 leading-relaxed">
                      &quot;회사&quot;는 본 &quot;서비스&quot;를 통해 제공되는 정보를 기반으로 한 투자 결정 및
                      그 결과에 대해 어떠한 책임도 지지 않습니다. 투자에 대한 최종 결정 및 손실
                      책임은 투자자 본인에게 있습니다.
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>제공되는 데이터 분석 결과의 정확성을 보증하지 않습니다.</li>
                    <li>과거 성과 시뮬레이션(백테스트) 결과가 미래 수익을 보장하지 않습니다.</li>
                    <li>시스템 오류, 데이터 지연 등으로 인한 손해에 대해 책임을 지지 않습니다.</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제6조 (회원 탈퇴 및 자격 상실)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    1. 회원은 언제든지 탈퇴를 요청할 수 있으며, &quot;회사&quot;는 즉시 회원 탈퇴를
                    처리합니다.
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    2. 회원이 다음 사유에 해당하는 경우, &quot;회사&quot;는 회원 자격을 제한하거나
                    정지할 수 있습니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>가입 시 허위 정보를 기재한 경우</li>
                    <li>다른 회원의 &quot;서비스&quot; 이용을 방해하는 경우</li>
                    <li>법령 또는 본 약관을 위반한 경우</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제7조 (저작권)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    1. &quot;서비스&quot; 내 모든 콘텐츠(분석 알고리즘, 데이터, UI 등)의 저작권은
                    &quot;회사&quot;에 귀속됩니다.
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    2. 회원은 &quot;회사&quot;의 사전 동의 없이 &quot;서비스&quot; 내 콘텐츠를 복제, 배포,
                    판매할 수 없습니다.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제8조 (개인정보 보호)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해
                    노력합니다. 개인정보 보호에 관한 사항은 별도의 개인정보처리방침에 따릅니다.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제9조 (분쟁 해결)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    본 약관과 관련하여 분쟁이 발생한 경우, &quot;회사&quot;의 본사 소재지를 관할하는
                    법원을 전속관할로 합니다.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">부칙</h2>
                  <p className="text-slate-300 leading-relaxed">
                    본 약관은 2025년 1월 1일부터 시행됩니다.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
