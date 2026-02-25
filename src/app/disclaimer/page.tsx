import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageSEO } from '@/components/seo';

export default function DisclaimerPage() {
  return (
    <>
      <PageSEO
        title="투자 유의사항 - Alpha Foundry"
        description="Alpha Foundry 투자 유의사항 및 면책 조항"
        noindex
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">투자 유의사항</h1>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="prose prose-invert max-w-none">
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                    <span className="text-3xl mr-2">⚠️</span>
                    투자 손실 위험 고지
                  </h2>
                  <p className="text-slate-200 leading-relaxed text-lg">
                    주식 투자는 원금 손실의 위험이 있으며, 투자에 대한 최종 결정 및 그에 따른 손실
                    책임은 투자자 본인에게 있습니다. 본 서비스가 제공하는 정보는 투자 판단의 참고
                    자료일 뿐이며, 어떠한 경우에도 투자 결과에 대한 법적 책임을 지지 않습니다.
                  </p>
                </div>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">1. 서비스 성격</h2>
                  <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                      정보 제공 서비스 (금융투자업 비해당)
                    </h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Alpha Foundry는 「자본시장과 금융투자업에 관한 법률」상 금융투자업(투자자문업,
                      투자일임업)에 해당하지 않는{' '}
                      <strong className="text-white">데이터 분석 정보 제공 서비스</strong>입니다.
                    </p>
                    <ul className="list-disc list-inside text-slate-300 space-y-2">
                      <li>투자 자문, 투자 일임 서비스를 제공하지 않습니다</li>
                      <li>특정 종목의 매수/매도를 권유하거나 투자 판단을 대행하지 않습니다</li>
                      <li>자동 매매, 증권사 계좌 연동 기능을 제공하지 않습니다</li>
                      <li>AI 알고리즘 기반 데이터 분석 결과를 참고 자료로만 제공합니다</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">2. 정보의 정확성</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    본 서비스가 제공하는 모든 정보는 AI 알고리즘 및 공개된 데이터를 기반으로
                    생성됩니다. 다음 사항에 유의하시기 바랍니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>
                      <strong className="text-white">데이터 오류 가능성:</strong> 외부 API 연동
                      과정에서 데이터 지연, 오류가 발생할 수 있습니다
                    </li>
                    <li>
                      <strong className="text-white">AI 예측 한계:</strong> AI 알고리즘의 예측이
                      항상 정확하지 않으며, 예측 결과가 실제와 다를 수 있습니다
                    </li>
                    <li>
                      <strong className="text-white">시스템 장애:</strong> 서버 오류, 네트워크 장애
                      등으로 서비스가 일시 중단될 수 있습니다
                    </li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    3. 성과 시뮬레이션(백테스트) 결과
                  </h2>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <p className="text-yellow-300 font-semibold mb-2">
                      ⚠️ 과거 성과는 미래 수익을 보장하지 않습니다
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      백테스트는 과거 데이터를 기반으로 전략을 시뮬레이션한 결과이며, 실제 투자
                      결과와 크게 다를 수 있습니다.
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>백테스트는 거래 비용(수수료, 세금)을 완전히 반영하지 못할 수 있습니다</li>
                    <li>과거 시장 환경과 미래 시장 환경은 다를 수 있습니다</li>
                    <li>백테스트 과정에서 생존 편향(Survivorship Bias)이 발생할 수 있습니다</li>
                    <li>실제 매매 시 슬리피지(Slippage)가 발생할 수 있습니다</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">4. 투자 위험</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    주식 투자에는 다음과 같은 위험이 있습니다:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">시장 위험</h3>
                      <p className="text-sm text-slate-300">
                        주식 시장 전체의 변동으로 인한 손실 위험
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">종목 위험</h3>
                      <p className="text-sm text-slate-300">
                        개별 기업의 실적 악화 등으로 인한 손실 위험
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">유동성 위험</h3>
                      <p className="text-sm text-slate-300">
                        거래량 부족으로 원하는 가격에 매도하지 못할 위험
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">환율 위험</h3>
                      <p className="text-sm text-slate-300">
                        해외 주식 투자 시 환율 변동으로 인한 손실 위험
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">5. 책임의 제한</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Alpha Foundry는 다음의 경우에 대해 법적 책임을 지지 않습니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>본 서비스의 정보를 기반으로 한 투자 결정 및 그 결과</li>
                    <li>제공된 데이터의 오류, 누락, 지연으로 인한 손해</li>
                    <li>시스템 장애, 네트워크 오류로 인한 서비스 중단</li>
                    <li>제3자(외부 API 제공업체)의 서비스 중단 또는 오류</li>
                    <li>사용자의 투자 전략 오류 또는 부적절한 매매 타이밍</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">6. 이용자의 책임</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    본 서비스를 이용하는 투자자는 다음 사항을 준수해야 합니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>
                      <strong className="text-white">독립적 판단:</strong> 제공된 정보를 맹목적으로
                      따르지 말고, 본인의 판단과 분석을 병행하십시오
                    </li>
                    <li>
                      <strong className="text-white">분산 투자:</strong> 한 종목에 집중 투자하지
                      말고 위험을 분산하십시오
                    </li>
                    <li>
                      <strong className="text-white">손실 관리:</strong> 손실 한도를 설정하고 철저히
                      관리하십시오
                    </li>
                    <li>
                      <strong className="text-white">재무 상태 고려:</strong> 본인의 재무 상태와
                      투자 목적에 맞는 투자 결정을 하십시오
                    </li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">7. 법적 고지</h2>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <ul className="list-disc list-inside text-slate-300 space-y-2">
                      <li>
                        본 서비스는 「자본시장과 금융투자업에 관한 법률」에 따른 금융투자업 등록을
                        받지 않았습니다
                      </li>
                      <li>
                        투자 자문을 원하시는 경우, 금융감독원에 등록된 투자자문업체를 이용하시기
                        바랍니다
                      </li>
                      <li>본 서비스는 투자 권유, 투자 자문, 투자 일임에 해당하지 않습니다</li>
                      <li>투자와 관련된 모든 의사결정은 이용자 본인의 책임 하에 이루어집니다</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">8. 문의</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    본 면책 조항과 관련하여 문의사항이 있으시면 아래로 연락 주시기 바랍니다:
                  </p>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-300">
                      • 이메일: support@alphafoundry.co.kr
                      <br />• 운영시간: 평일 09:00 ~ 18:00 (주말 및 공휴일 제외)
                    </p>
                  </div>
                </section>

                <div className="mt-8 pt-6 border-t border-slate-700">
                  <p className="text-slate-400 text-sm text-center">최종 수정일: 2025년 1월 1일</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
