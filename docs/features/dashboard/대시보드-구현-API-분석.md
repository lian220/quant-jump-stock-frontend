# 대시보드 구현·API 분석

- **프로젝트**: Quant Jump Stock Frontend
- **작성일**: 2026-03-04
- **관련 티켓**: SCRUM-174 [Story 5.1] 메인 대시보드
- **관련 문서**:
  - [메인-대시보드-벤치마킹.md](./메인-대시보드-벤치마킹.md)
  - [대시보드-UX-전문가-분석.md](./대시보드-UX-전문가-분석.md)
- **상태**: P0 구현 완료 (Dashboard API 연동, PersonalDashboard/MarketWidget 적용)

---

## 1. 현행 구현 요약

### 1.1 메인 페이지(`src/app/page.tsx`)에서 사용하는 데이터

| 데이터 | 훅 | 용도 |
|--------|-----|------|
| 인증 | `useAuth()` | 로그인 여부 → 로그인/비로그인 뷰 분기 |
| 전략 목록 | `useStrategies()` | 인기 투자 전략 3개 (구독자순) |
| 예측 통계 | `usePredictionStats(30)` | 30일 uniqueTickers, gradeDistribution, avgCompositeScore |
| 최신 예측 | `useLatestPredictions()` | analysisDate(마지막 업데이트) |
| AI 매수 신호 | `useBuySignals()` | AI 주목 종목(strong/medium tier) |
| 최신 뉴스 | `useRecentNews(3)` | 뉴스 미리보기 3건 |

**로그인 여부만으로 분기하며, Dashboard API는 호출하지 않음.**

### 1.2 로그인 뷰 현재 구조

1. 헤더 + 미니 대시보드(분석 개수, 좋은 평가 비율, 평균 AI 점수)
2. AI 주목 종목(카드 그리드)
3. 뉴스 + 인기 전략(2컬럼)
4. 투자 유의사항

**미표시 항목**: 구독 전략 요약, 미읽은 신호(signals), 시장 지수(market), AI 사용량(aiUsage), 닉네임/티어/가입일(user).

---

## 2. Dashboard API vs 현행 사용

### 2.1 API 스펙(`src/lib/api/dashboard.ts`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `user` | nickname, tier, joinDate | 사용자 요약 |
| `subscriptions` | count, maxCount, strategies[] | 구독 전략 수/상한/목록 |
| `signals` | unreadCount, todayCount, recent[] | 미읽은 알림, 오늘 건수, 최근 알림 |
| `market` | indices[] (symbol, name, price, changePercent) | 시장 지수 |
| `aiUsage` | backtestUsed, backtestLimit, backtestRemaining | 백테스트 사용량 |

### 2.2 인프라

- **클라이언트**: `getDashboard()` — 브라우저면 `/api/dashboard`, SSR이면 `API_URL/api/v1/dashboard`
- **프록시**: `src/app/api/dashboard/route.ts` — Authorization 헤더 전달, 401/503/504 처리
- **훅**: `useDashboard(isLoggedIn)` — 로그인 시에만 `'dashboard'` 키로 SWR 호출, 1분 캐시

### 2.3 갭 정리

| Dashboard API 데이터 | UX 문서 권장 | 현행 메인 페이지 |
|---------------------|-------------|------------------|
| user (닉네임, 티어, 가입일) | 로그인 대시 개인화 | **미사용** |
| subscriptions (구독 전략 요약) | ① 개인 요약, 구독 전략 성과 | **미사용** |
| signals (미읽은 신호, 오늘 건수) | ② 시장+알림, 미읽은 신호 블록 | **미사용** |
| market (지수) | ② 시장 지수 블록 | **미사용** |
| aiUsage (백테스트 사용량) | ① AI 사용량 게이지 | **미사용** |

**결론: Dashboard API는 구현·훅·라우트까지 갖춰져 있으나, 메인 페이지에서 전혀 사용하지 않음.**

---

## 3. UX 권장 vs 현행 매핑

### 3.1 PC 로그인 대시보드(Wireframe 기준)

| UX 문서 영역 | 데이터 소스 | 현행 |
|-------------|------------|------|
| ① 개인 요약 (구독 전략 성과, AI 사용량) | subscriptions, aiUsage | 없음 |
| ② 시장 + 알림 (지수, 미읽은 신호) | market, signals | 없음 |
| ③ AI 주목 종목 | 기존 predictions/buy-signals | ✅ 표시 |
| ④ 인기 전략 | 전략 API | ✅ 표시 |
| ⑤ 최신 뉴스 | 뉴스 API | ✅ 표시 |

### 3.2 모바일 로그인 대시보드

| UX 문서 영역 | 데이터 소스 | 현행 |
|-------------|------------|------|
| ① 핵심 숫자 3개 (구독 성과, 미읽은 신호, AI 적중률) | subscriptions, signals, predictionStats | 구독/신호 미표시 |
| ② 미읽은 신호 리스트 | signals.recent | 없음 |
| ③ 시장 지수 | market.indices | 없음 |
| ④ AI 주목 종목 | buy-signals | ✅ 표시 |
| ⑤⑥ 전략/뉴스 | 전략 API, 뉴스 API | ✅ 표시 |

---

## 4. 구현 완료 항목 및 후속 과제

### 완료 항목 (P0)

1. **✅ 메인 페이지에서 `useDashboard(user !== null)` 호출**
   - 로그인 시에만 Dashboard API 사용, 기존 훅 그대로 활용.

2. **✅ 로그인 뷰에 Dashboard 데이터 노출**
   - ① **개인 요약**: subscriptions(count/maxCount), aiUsage(backtest 사용량/한도)
   - ② **시장·알림**: market.indices(지수), signals(unreadCount, todayCount, recent[])
   - PersonalDashboard + MarketWidget 컴포넌트로 구현.

3. **✅ 에러/로딩 처리**
   - Dashboard API 실패 시 기존 대시보드(전략·AI 종목·뉴스)는 유지, 개인 요약/시장·알림만 숨김 처리.

### 후속 개선 과제

4. **추가 검토**
   - 구독 전략 **성과**(수익률 등)가 Dashboard API에 없으면, 별도 API 또는 전략 API와 조합 필요.

---

## 5. 파일 참조

| 구분 | 경로 |
|------|------|
| 메인 페이지 | `src/app/page.tsx` |
| Dashboard API 클라이언트 | `src/lib/api/dashboard.ts` |
| Dashboard 훅 | `src/hooks/useData.ts` → `useDashboard(isLoggedIn)` |
| Dashboard API 라우트 | `src/app/api/dashboard/route.ts` |
