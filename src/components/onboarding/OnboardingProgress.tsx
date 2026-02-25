'use client';

import type { OnboardingStep } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  totalSteps: 3;
}

const STEP_LABELS = ['투자 성향', '시장 · 위험 성향', '완료'];

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="w-full max-w-xs mx-auto">
      {/* 프로그레스 바 */}
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;

          return (
            <div key={step} className="flex-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  isCompleted && 'bg-emerald-500',
                  isActive && 'bg-emerald-400',
                  !isCompleted && !isActive && 'bg-slate-700',
                )}
              />
            </div>
          );
        })}
      </div>

      {/* 스텝 라벨 */}
      <p className="text-center text-xs text-slate-500">
        {currentStep}/{totalSteps} · {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}
