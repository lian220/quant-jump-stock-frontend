'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthFormData } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignUpForm = ({ onSuccess, onSwitchToLogin }: SignUpFormProps) => {
  const { signUp, signInWithNaver, loading } = useAuth();
  const [formData, setFormData] = useState<AuthFormData>({
    userId: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.userId || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 필수 필드를 입력해주세요');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    const result = await signUp(
      formData.userId,
      formData.email,
      formData.password,
      formData.name,
      formData.phone || undefined,
    );

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('회원가입이 완료되었습니다! 로그인해주세요.');
      onSuccess?.();
    }
  };

  const handleNaverSignIn = async () => {
    setError('');
    const result = await signInWithNaver();

    if (result.error) {
      setError(result.error);
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
        <CardTitle className="text-2xl font-bold text-white">회원가입</CardTitle>
        <CardDescription className="text-slate-400">
          새 계정을 만들어 퀀트 투자를 시작하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-slate-300">
              아이디 <span className="text-red-400">*</span>
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
            <Label htmlFor="email" className="text-slate-300">
              이메일 <span className="text-red-400">*</span>
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="이메일을 입력하세요"
              disabled={loading}
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              이름
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="이름을 입력하세요 (선택)"
              disabled={loading}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">
              휴대전화번호
            </Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="010-1234-5678 (선택)"
              disabled={loading}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              비밀번호 <span className="text-red-400">*</span>
            </Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              disabled={loading}
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">
              비밀번호 확인 <span className="text-red-400">*</span>
            </Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="비밀번호를 다시 입력하세요"
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
            {loading ? '가입 중...' : '회원가입'}
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
            네이버로 가입
          </Button>
        </div>

        {onSwitchToLogin && (
          <p className="text-center text-sm text-slate-400">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              로그인
            </button>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
