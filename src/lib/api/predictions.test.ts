import { describe, it, expect } from 'vitest';
import {
  getScoreGrade,
  normalizeGrade,
  classifyByTier,
  computeAGradeRatio,
  type BuySignal,
  type CompositeGrade,
} from './predictions';

// 테스트용 BuySignal 팩토리 (필수 필드만 채우고 grade를 주입)
function makeSignal(overrides: Partial<BuySignal>): BuySignal {
  return {
    ticker: 'TEST',
    stockName: '테스트',
    analysisDate: '2026-06-07',
    compositeScore: 50,
    compositeGrade: 'B',
    aiScore: 0,
    techScore: 0,
    sentimentScore: 0,
    techScoreDisplay: 0,
    aiScoreDisplay: 0,
    sentimentScoreDisplay: 0,
    compositeScoreDisplay: 50,
    isRecommended: false,
    ...overrides,
  };
}

describe('normalizeGrade', () => {
  it('S/A/B/C/D는 그대로 반환한다', () => {
    expect(normalizeGrade('S')).toBe('S');
    expect(normalizeGrade('A')).toBe('A');
    expect(normalizeGrade('B')).toBe('B');
    expect(normalizeGrade('C')).toBe('C');
    expect(normalizeGrade('D')).toBe('D');
  });

  it('레거시 enum(EXCELLENT/GOOD/FAIR/LOW)을 S/A/B/C/D로 정규화한다', () => {
    expect(normalizeGrade('EXCELLENT')).toBe('A');
    expect(normalizeGrade('GOOD')).toBe('B');
    expect(normalizeGrade('FAIR')).toBe('C');
    expect(normalizeGrade('LOW')).toBe('D');
  });

  it('알 수 없는 값/null/undefined는 D로 안전 폴백한다', () => {
    expect(normalizeGrade('UNKNOWN')).toBe('D');
    expect(normalizeGrade(null)).toBe('D');
    expect(normalizeGrade(undefined)).toBe('D');
    expect(normalizeGrade('')).toBe('D');
  });
});

describe('getScoreGrade', () => {
  it('S/A/B/C/D 각 등급을 색·라벨에 매핑한다 (scoring_spec 색 정합)', () => {
    expect(getScoreGrade('S')).toMatchObject({
      grade: 'S',
      label: '매우 강한 매수',
      color: 'text-emerald-400',
      bar: 'bg-emerald-400',
    });
    expect(getScoreGrade('A')).toMatchObject({ grade: 'A', color: 'text-cyan-400' });
    expect(getScoreGrade('B')).toMatchObject({ grade: 'B', color: 'text-yellow-400' });
    expect(getScoreGrade('C')).toMatchObject({ grade: 'C', color: 'text-orange-400' });
    expect(getScoreGrade('D')).toMatchObject({ grade: 'D', color: 'text-slate-400' });
  });

  it('모든 등급에 BETA 뱃지를 유지한다 (§5 시계열 단절 커뮤니케이션)', () => {
    const grades: CompositeGrade[] = ['S', 'A', 'B', 'C', 'D'];
    for (const g of grades) {
      expect(getScoreGrade(g).badge).toBe('BETA');
    }
  });

  it('레거시 enum 입력도 정규화하여 매핑한다', () => {
    expect(getScoreGrade('EXCELLENT').grade).toBe('A');
    expect(getScoreGrade('GOOD').grade).toBe('B');
    expect(getScoreGrade('FAIR').grade).toBe('C');
    expect(getScoreGrade('LOW').grade).toBe('D');
  });

  it('점수 임계를 재계산하지 않는다 — 동일 점수라도 grade가 다르면 색이 다르다', () => {
    // 같은 52점이지만 백엔드 grade가 다르면 색도 다르다 (이중스케일 버그 방지)
    const asA = getScoreGrade('A');
    const asD = getScoreGrade('D');
    expect(asA.color).not.toBe(asD.color);
  });
});

describe('classifyByTier (grade 기반)', () => {
  it('S/A는 strong, B/C는 medium, D는 weak으로 분류한다', () => {
    const signals = [
      makeSignal({ ticker: 'S1', compositeGrade: 'S', compositeScore: 90 }),
      makeSignal({ ticker: 'A1', compositeGrade: 'A', compositeScore: 80 }),
      makeSignal({ ticker: 'B1', compositeGrade: 'B', compositeScore: 65 }),
      makeSignal({ ticker: 'C1', compositeGrade: 'C', compositeScore: 55 }),
      makeSignal({ ticker: 'D1', compositeGrade: 'D', compositeScore: 40 }),
    ];
    const { strong, medium, weak } = classifyByTier(signals);
    expect(strong.map((s) => s.ticker)).toEqual(['S1', 'A1']);
    expect(medium.map((s) => s.ticker)).toEqual(['B1', 'C1']);
    expect(weak.map((s) => s.ticker)).toEqual(['D1']);
  });

  it('레거시 enum 등급도 분류한다', () => {
    const signals = [
      makeSignal({ ticker: 'E', compositeGrade: 'EXCELLENT' }), // → A → strong
      makeSignal({ ticker: 'F', compositeGrade: 'FAIR' }), // → C → medium
      makeSignal({ ticker: 'L', compositeGrade: 'LOW' }), // → D → weak
    ];
    const { strong, medium, weak } = classifyByTier(signals);
    expect(strong.map((s) => s.ticker)).toEqual(['E']);
    expect(medium.map((s) => s.ticker)).toEqual(['F']);
    expect(weak.map((s) => s.ticker)).toEqual(['L']);
  });

  it('각 tier 내에서 점수 내림차순 정렬한다', () => {
    const signals = [
      makeSignal({ ticker: 'A_low', compositeGrade: 'A', compositeScore: 70 }),
      makeSignal({ ticker: 'S_high', compositeGrade: 'S', compositeScore: 95 }),
    ];
    const { strong } = classifyByTier(signals);
    expect(strong.map((s) => s.ticker)).toEqual(['S_high', 'A_low']);
  });
});

describe('computeAGradeRatio', () => {
  it('S+A 비율을 백분율로 계산한다', () => {
    expect(computeAGradeRatio({ S: 1, A: 1, B: 2, C: 4, D: 2 })).toBe(20);
  });

  it('레거시 EXCELLENT/GOOD도 합산한다', () => {
    expect(computeAGradeRatio({ EXCELLENT: 1, GOOD: 1, FAIR: 2 })).toBe(50);
  });

  it('총합이 0이면 null을 반환한다', () => {
    expect(computeAGradeRatio({})).toBeNull();
  });
});
