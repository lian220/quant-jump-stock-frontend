/* eslint-disable react/no-unescaped-entities */
/* eslint-disable prettier/prettier */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageSEO } from '@/components/seo';

export default function PrivacyPage() {
  return (
    <>
      <PageSEO
        title="개인정보처리방침 - Alpha Foundry"
        description="Alpha Foundry 개인정보처리방침"
        noindex
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">개인정보처리방침</h1>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="prose prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제1조 (개인정보의 처리 목적)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Alpha Foundry(이하 "&quot;회사&quot;")는 다음의 목적을 위하여 개인정보를
                    처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지
                    않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의
                    동의를 받는 등 필요한 조치를 이행할 예정입니다.
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>회원 가입 및 관리</li>
                    <li>서비스 제공 및 계약 이행</li>
                    <li>고객 문의 응대</li>
                    <li>서비스 개선 및 통계 분석</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제2조 (개인정보의 처리 및 보유 기간)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터
                    개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를
                    처리·보유합니다.
                  </p>
                  <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">1. 회원 정보</h3>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      <li>수집 항목: 이메일, 닉네임</li>
                      <li>보유 기간: 회원 탈퇴 시까지</li>
                      <li>제공자: Supabase Auth (네이버 로그인 연동)</li>
                    </ul>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">2. 결제 정보</h3>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      <li>수집 항목: 결제 승인 번호, 결제 금액</li>
                      <li>보유 기간: 전자상거래법에 따라 5년</li>
                      <li>제공자: TossPayments (결제 대행)</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제3조 (개인정보의 제3자 제공)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                    다만, 아래의 경우는 예외로 합니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>이용자가 사전에 동의한 경우</li>
                    <li>
                      법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라
                      수사기관의 요구가 있는 경우
                    </li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제4조 (개인정보 처리의 위탁)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를
                    위탁하고 있습니다:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300 mb-4">
                      <thead className="text-xs uppercase bg-slate-700/50 text-slate-300">
                        <tr>
                          <th className="px-4 py-3">수탁업체</th>
                          <th className="px-4 py-3">위탁 업무</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3">Supabase</td>
                          <td className="px-4 py-3">회원 인증 및 데이터 저장</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3">TossPayments</td>
                          <td className="px-4 py-3">결제 처리</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3">Google Cloud Platform</td>
                          <td className="px-4 py-3">서버 호스팅</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제5조 (정보주체의 권리·의무 및 행사 방법)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    이용자는 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>개인정보 열람 요구</li>
                    <li>개인정보 정정·삭제 요구</li>
                    <li>개인정보 처리 정지 요구</li>
                    <li>회원 탈퇴 (개인정보 삭제)</li>
                  </ul>
                  <p className="text-slate-300 leading-relaxed mt-4">
                    권리 행사는 서비스 내 설정 페이지 또는 고객센터를 통해 가능합니다.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">제6조 (개인정보의 파기)</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가
                    불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>파기 절차: 불필요한 개인정보는 내부 방침에 따라 파기</li>
                    <li>파기 방법: 전자적 파일은 복구 불가능한 방법으로 영구 삭제</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제7조 (개인정보 보호책임자)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
                    처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보
                    보호책임자를 지정하고 있습니다:
                  </p>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-300">
                      • 책임자: Alpha Foundry 운영팀
                      <br />• 이메일: privacy@alphafoundry.co.kr
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    제8조 (개인정보의 안전성 확보)
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    &quot;회사&quot;는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
                    있습니다:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>개인정보 암호화 (SSL/TLS 통신)</li>
                    <li>접근 권한 관리 및 통제</li>
                    <li>보안 프로그램 설치 및 주기적 갱신</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">부칙</h2>
                  <p className="text-slate-300 leading-relaxed">
                    본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.
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
