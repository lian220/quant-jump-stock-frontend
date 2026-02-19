# Dashboard [Draft]

메인 대시보드 - 사용자가 로그인 후 가장 먼저 보는 화면

## Route

`/dashboard`

## Features

### 1. 오늘의 추천 종목

| Item | Description |
|------|-------------|
| API | `GET /api/v1/predictions/latest` |
| 표시 항목 | 종목명, 현재가, 예측 신호, 신뢰도 |
| 정렬 | 신뢰도 높은 순 |
| 필터 | BUY 신호만 표시 옵션 |

### 2. 매수 신호 목록

| Item | Description |
|------|-------------|
| API | `GET /api/v1/predictions/buy-signals?minConfidence=0.7` |
| 표시 항목 | 종목명, 복합 점수, 기술적 지표 요약 |
| 액션 | 클릭 시 종목 상세 이동 |

### 3. 포트폴리오 요약

| Item | Description |
|------|-------------|
| API | `GET /api/v1/users/{userId}/balance` |
| 표시 항목 | 총 자산, 보유 종목 수, 평가 손익, 수익률 |
| 갱신 | 실시간 또는 1분 간격 |

### 4. 분석 상태 위젯

| Item | Description |
|------|-------------|
| API | `GET /api/v1/analyses/status` |
| 표시 항목 | 마지막 분석 시간, 다음 예정 시간 |
| 상태 | 정상/지연/오류 표시 |

## UI Components

- `RecommendationCard` - 추천 종목 카드
- `PortfolioSummary` - 포트폴리오 요약 박스
- `AnalysisStatus` - 분석 상태 뱃지
- `QuickActions` - 빠른 액션 버튼들

## Acceptance Criteria

- [ ] 페이지 로드 시 모든 위젯 데이터 로드
- [ ] 로딩 상태 스켈레톤 UI 표시
- [ ] 에러 발생 시 재시도 버튼 제공
- [ ] 모바일 반응형 레이아웃
