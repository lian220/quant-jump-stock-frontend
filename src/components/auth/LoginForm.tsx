'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthFormData } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignUp }: LoginFormProps) => {
  const { signIn, signInWithGoogle, signInWithNaver, loading } = useAuth();
  const [formData, setFormData] = useState<AuthFormData>({
    userId: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.password) {
      toast.error('아이디와 비밀번호를 입력해주세요');
      return;
    }

    const result = await signIn(formData.userId, formData.password);

    if (result.error) {
      toast.error(result.error, {
        duration: 5000,
      });
    } else {
      toast.success('로그인 성공! 잠시 후 이동합니다...', {
        duration: 2000,
      });
      // 2초 후 페이지 이동
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();

    if (result.error) {
      toast.error(result.error, {
        duration: 5000,
      });
    }
  };

  const handleNaverSignIn = async () => {
    const result = await signInWithNaver();

    if (result.error) {
      toast.error(result.error, {
        duration: 5000,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/50 border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">로그인</CardTitle>
        <CardDescription className="text-slate-400">
          계정에 로그인하여 투자 분석을 시작하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-slate-300">
              아이디
            </Label>
            <Input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              placeholder="아이디를 입력하세요"
              disabled={loading}
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              비밀번호
            </Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-500">또는</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleNaverSignIn}
            disabled={loading}
            className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
              />
            </svg>
            네이버로 로그인
          </Button>
        </div>

        {onSwitchToSignUp && (
          <p className="text-center text-sm text-slate-400">
            계정이 없으신가요?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              회원가입
            </button>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
