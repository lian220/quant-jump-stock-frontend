'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

type ConfirmTone = 'danger' | 'default';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 다크 테마에 맞는 inline confirm 다이얼로그.
 * native `confirm()` 대신 일관된 컨텍스트 유지.
 *
 * tone='danger' — 실전 계좌 매핑 / 자금 노출 같은 임계 행위.
 *               red accent + 명시적 확인 라벨.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = tone === 'danger';

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-xl animate-in fade-in zoom-in-95"
          data-testid="confirm-dialog"
        >
          {isDanger && <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-red-500" />}
          <Dialog.Title
            className={`text-base font-semibold ${isDanger ? 'text-red-300' : 'text-white'}`}
          >
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-slate-400 whitespace-pre-line">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              data-testid="confirm-dialog-cancel"
            >
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              className={
                isDanger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
              data-testid="confirm-dialog-confirm"
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
