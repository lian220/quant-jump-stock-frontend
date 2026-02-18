// 전략 관련 공용 헬퍼 함수

// 리스크 레벨 색상
export const getRiskColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

// 리스크 레벨 한글
export const getRiskLabel = (level: string) => {
  switch (level) {
    case 'low':
      return '낮음';
    case 'medium':
      return '중간';
    case 'high':
      return '높음';
    default:
      return level;
  }
};

// 카테고리 한글
export const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    value: '가치투자',
    momentum: '모멘텀',
    asset_allocation: '자산배분',
    quant_composite: '퀀트 복합',
    seasonal: '시즌널',
    ml_prediction: 'AI 예측',
    all: '전체',
  };
  return labels[category] || category;
};

// 룰 타입 한글
export const getRuleTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    entry: '진입 조건',
    exit: '청산 조건',
    filter: '필터 조건',
    rebalance: '리밸런싱',
  };
  return labels[type] || type;
};

// 룰 타입 색상
export const getRuleTypeColor = (type: string) => {
  switch (type) {
    case 'entry':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'exit':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'filter':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'rebalance':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

// SCRUM-351: Universe 타입 한글 레이블 (공유 상수)
export const UNIVERSE_LABELS: Record<string, string> = {
  MARKET: '전체 시장',
  PORTFOLIO: '전략 기본 종목',
  SECTOR: '섹터별',
  FIXED: '지정 종목',
};

// SCRUM-351: Universe 타입 색상 클래스 (공유 상수)
export const UNIVERSE_COLOR_CLASSES: Record<string, string> = {
  MARKET: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  PORTFOLIO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  SECTOR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  FIXED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export const getUniverseLabel = (type: string): string => UNIVERSE_LABELS[type] ?? type;

export const getUniverseColor = (type: string): string =>
  UNIVERSE_COLOR_CLASSES[type] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
