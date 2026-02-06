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
    momentum: '모멘텀',
    value: '밸류',
    growth: '성장주',
    dividend: '배당주',
    factor: '팩터',
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
