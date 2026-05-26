'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AccountManagementSection() {
  const { user, signOut, resetPassword } = useAuth();
  const router = useRouter();

  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  async function handlePasswordReset() {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    setPasswordResetError(null);
    const result = await resetPassword(user.email);
    if (result.error) {
      setPasswordResetError(result.error);
    } else {
      setPasswordResetSent(true);
    }
    setPasswordResetLoading(false);
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">계정 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 비밀번호 변경 */}
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <div>
            <p className="text-slate-300 text-sm">비밀번호 변경</p>
            <p className="text-slate-500 text-xs mt-0.5">이메일로 재설정 링크를 보내드려요</p>
            {passwordResetError && (
              <p className="text-red-400 text-xs mt-1">{passwordResetError}</p>
            )}
          </div>
          {passwordResetSent ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              메일 발송 완료
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
              onClick={handlePasswordReset}
              disabled={passwordResetLoading}
            >
              {passwordResetLoading ? '발송 중...' : '재설정 메일 받기'}
            </Button>
          )}
        </div>

        {/* 로그아웃 */}
        <div className="flex justify-between items-center py-2">
          <div>
            <p className="text-slate-300 text-sm">로그아웃</p>
            <p className="text-slate-500 text-xs mt-0.5">현재 기기에서 로그아웃합니다</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
          >
            로그아웃
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
