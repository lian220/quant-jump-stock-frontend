'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUniverseLabel, getUniverseColor } from '@/lib/strategy-helpers';
import type { StrategyDetail, UniverseType } from '@/types/strategy';

interface Props {
  strategy: StrategyDetail;
  selectedUniverseType: UniverseType;
  onSelectUniverseType: (type: UniverseType) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function StrategyUniverseModal({
  strategy,
  selectedUniverseType,
  onSelectUniverseType,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-xl font-bold text-white mb-1">투자 유니버스 선택</h3>
        <p className="text-slate-400 text-sm mb-5">매매 신호를 적용할 종목 범위를 선택하세요.</p>

        <div className="space-y-3 mb-6">
          {(strategy.supportedUniverseTypes ?? ['MARKET']).map((type) => (
            <button
              key={type}
              onClick={() => onSelectUniverseType(type)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
                selectedUniverseType === type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedUniverseType === type
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-500'
                }`}
              >
                {selectedUniverseType === type && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <Badge className={`${getUniverseColor(type)} text-xs`}>
                    {getUniverseLabel(type)}
                  </Badge>
                  {type === strategy.recommendedUniverseType && (
                    <span className="text-xs text-emerald-400">추천</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {type === 'MARKET' && '시장 전체 종목 중 신호 발생 종목에 적용'}
                  {type === 'PORTFOLIO' && '전략 기본 종목 포트폴리오에만 적용'}
                  {type === 'FIXED' && '지정된 고정 종목 목록에만 적용'}
                  {type === 'SECTOR' && '특정 섹터 종목에만 적용'}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            className={`flex-1 ${
              strategy.isPremium
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            onClick={onConfirm}
          >
            {getUniverseLabel(selectedUniverseType)}으로 구독
          </Button>
        </div>
      </div>
    </div>
  );
}
