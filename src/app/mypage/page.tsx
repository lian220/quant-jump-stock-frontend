'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const infoItems = [
    { label: '아이디', value: user.userId },
    { label: '이름', value: user.name || '-' },
    { label: '이메일', value: user.email },
    { label: '휴대전화번호', value: user.phone || '-' },
    { label: '등급', value: user.role === 'ADMIN' ? '관리자' : '일반 회원' },
    { label: '상태', value: user.status === 'ACTIVE' ? '활성' : user.status },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">마이페이지</h1>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">내 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0"
              >
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              signOut();
              router.push('/');
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
