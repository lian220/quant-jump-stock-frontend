'use client';

import React, { useState } from 'react';
import { NaverPayButton } from '@/components/payment';
import { generateNaverOrderId } from '@/lib/naver-pay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Button import removed - not used in this file
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Building, Gift, Info } from 'lucide-react';

interface TestProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

const testProducts: TestProduct[] = [
  {
    id: 'plan_basic',
    name: '베이직 플랜',
    price: 29000,
    description: '월간 구독 - 기본 퀀트 분석 및 알림',
    category: '월간',
  },
  {
    id: 'plan_pro',
    name: '프로 플랜',
    price: 79000,
    description: '월간 구독 - AI 분석 + 백테스팅 + 실시간 신호',
    category: '월간',
  },
  {
    id: 'plan_premium',
    name: '프리미엄 플랜',
    price: 149000,
    description: '월간 구독 - 모든 기능 + 1:1 투자 상담',
    category: '월간',
  },
  {
    id: 'plan_yearly',
    name: '연간 프리미엄',
    price: 1490000,
    description: '연간 구독 - 프리미엄 기능 + 2개월 무료',
    category: '연간',
  },
  {
    id: 'test_small',
    name: '테스트 소액결제',
    price: 1000,
    description: '결제 테스트를 위한 소액 상품',
    category: '테스트',
  },
  {
    id: 'test_large',
    name: '테스트 고액결제',
    price: 1000000,
    description: '고액 결제 테스트를 위한 상품',
    category: '테스트',
  },
];

export default function PaymentTestPage() {
  const [selectedProduct, setSelectedProduct] = useState<TestProduct>(testProducts[0]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '홍길동',
    email: 'test@example.com',
    phone: '010-1234-5678',
  });

  const [paymentHistory, setPaymentHistory] = useState<
    Array<{
      orderId: string;
      product: string;
      amount: number;
      status: 'success' | 'fail' | 'pending';
      timestamp: Date;
    }>
  >([]);

  const handlePaymentSuccess = (orderId: string) => {
    setPaymentHistory((prev) => [
      ...prev,
      {
        orderId,
        product: selectedProduct.name,
        amount: selectedProduct.price,
        status: 'success',
        timestamp: new Date(),
      },
    ]);
  };

  const handlePaymentError = (error: string) => {
    setPaymentHistory((prev) => [
      ...prev,
      {
        orderId: generateNaverOrderId(),
        product: selectedProduct.name,
        amount: selectedProduct.price,
        status: 'fail',
        timestamp: new Date(),
      },
    ]);
    console.error('결제 오류:', error);
  };

  const getPaymentAmount = () => {
    return selectedProduct.price;
  };

  const getOrderName = () => {
    return selectedProduct.name;
  };

  const generateTestOrderId = () => {
    return generateNaverOrderId();
  };

  return (
    <>
      {/* SEO 메타태그 */}
      <PageSEO
        title={pageDefaults.payment.title}
        description={pageDefaults.payment.description}
        keywords={pageDefaults.payment.keywords}
        ogImage="/images/og/payment.jpg"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">프리미엄 플랜</h1>
            <p className="text-slate-400 mb-4">AI 퀀트 투자의 모든 기능을 경험하세요</p>
            <Alert className="bg-slate-800/50 border-slate-700 text-slate-300">
              <Info className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-slate-400">
                테스트 환경에서는 실제 결제가 발생하지 않습니다. 안심하고 기능을 체험해보세요.
              </AlertDescription>
            </Alert>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 상품 선택 */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Gift className="h-5 w-5 text-emerald-400" />
                    <span>플랜 선택</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedProduct.id === product.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-white">{product.name}</h3>
                          <Badge
                            className={
                              product.category === '테스트'
                                ? 'bg-slate-600 text-slate-300'
                                : product.category === '연간'
                                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }
                          >
                            {product.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{product.description}</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {product.price.toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 고객 정보 */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Building className="h-5 w-5 text-emerald-400" />
                    <span>고객 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customerName" className="text-slate-300">
                        이름
                      </Label>
                      <Input
                        id="customerName"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail" className="text-slate-300">
                        이메일
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone" className="text-slate-300">
                        전화번호
                      </Label>
                      <Input
                        id="customerPhone"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 결제 패널 */}
            <div className="space-y-6">
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="text-emerald-400">💳 결제 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-slate-500">선택된 플랜</Label>
                      <p className="font-medium text-white">{selectedProduct.name}</p>
                      <p className="text-sm text-slate-400">{selectedProduct.description}</p>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div>
                      <Label className="text-sm text-slate-500">결제 금액</Label>
                      <p className="text-2xl font-bold text-emerald-400">
                        {getPaymentAmount().toLocaleString()}원
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-slate-500">주문자</Label>
                      <p className="font-medium text-white">{customerInfo.name}</p>
                      <p className="text-sm text-slate-400">{customerInfo.email}</p>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <NaverPayButton
                    amount={getPaymentAmount()}
                    orderName={getOrderName()}
                    orderId={generateTestOrderId()}
                    customerName={customerInfo.name}
                    customerEmail={customerInfo.email}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• 테스트 환경에서는 실제 결제가 발생하지 않습니다</p>
                    <p>• 네이버 아이디로 간편하게 결제하세요</p>
                    <p>• 네이버페이 포인트 적립 가능</p>
                  </div>
                </CardContent>
              </Card>

              {/* 결제 이력 */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Smartphone className="h-5 w-5 text-emerald-400" />
                    <span>최근 결제 이력</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      아직 결제 이력이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory
                        .slice(-5)
                        .reverse()
                        .map((history, index) => (
                          <div
                            key={index}
                            className="p-3 border border-slate-600 rounded bg-slate-700/30"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-medium text-white">{history.product}</p>
                              <Badge
                                className={
                                  history.status === 'success'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                                }
                              >
                                {history.status === 'success' ? '성공' : '실패'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mb-1">
                              {history.amount.toLocaleString()}원
                            </p>
                            <p className="text-xs text-slate-500">
                              {history.timestamp.toLocaleString('ko-KR')}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
