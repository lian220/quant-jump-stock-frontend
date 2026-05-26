'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function ProfileSection() {
  const { user, updateProfile } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const profileMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    };
  }, []);

  async function handleSaveName() {
    if (!editName.trim()) return;
    setProfileSaving(true);
    setProfileMessage(null);
    const result = await updateProfile({ displayName: editName.trim() });
    if (result.error) {
      setProfileMessage({ type: 'error', text: result.error });
    } else {
      setProfileMessage({ type: 'success', text: '이름이 변경되었어요' });
      setIsEditingName(false);
    }
    setProfileSaving(false);
    if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    profileMessageTimer.current = setTimeout(() => setProfileMessage(null), 3000);
  }

  if (!user) return null;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white">내 프로필</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profileMessage && (
          <div
            className={`text-xs px-3 py-2 rounded-lg ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {profileMessage.text}
          </div>
        )}

        {/* 이름 */}
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">이름</span>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-7 w-32 text-sm bg-slate-700 border-slate-600 text-white"
                placeholder="이름 입력"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSaveName}
                disabled={profileSaving || !editName.trim()}
              >
                {profileSaving ? '...' : '저장'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-slate-400 hover:text-white"
                onClick={() => setIsEditingName(false)}
              >
                취소
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">{user.name || '미설정'}</span>
              <button
                onClick={() => {
                  setEditName(user.name || '');
                  setIsEditingName(true);
                }}
                className="text-slate-500 hover:text-emerald-400 transition-colors text-xs"
              >
                수정
              </button>
            </div>
          )}
        </div>

        {/* 아이디 */}
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">아이디</span>
          <span className="text-white text-sm font-medium">{user.userId}</span>
        </div>

        {/* 이메일 */}
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">이메일</span>
          <span className="text-white text-sm font-medium">{user.email}</span>
        </div>

        {/* 전화번호 */}
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-slate-400 text-sm">전화번호</span>
          <span className="text-white text-sm font-medium">{user.phone || '미설정'}</span>
        </div>

        {/* 등급 */}
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-400 text-sm">등급</span>
          <Badge
            variant="outline"
            className={`text-xs ${
              user.role === 'ADMIN'
                ? 'border-purple-500/30 text-purple-400'
                : 'border-slate-600 text-slate-400'
            }`}
          >
            {user.role === 'ADMIN' ? '관리자' : '일반 회원'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
