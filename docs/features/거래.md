# Trades [Draft]

거래 내역 - 체결된 매매 기록 및 수익률 조회

## Route

`/trades`

## Features

### 1. 거래 이력 조회

| Item | Description |
|------|-------------|
| API | `GET /api/v1/users/{userId}/trades` |
| 표시 항목 | 일시, 종목, 매수/매도, 수량, 가격, 손익 |
| 필터 | 기간, 종목, 매수/매도 |
| 정렬 | 최신순 (기본), 손익순 |
| 페이지네이션 | 무한 스크롤 또는 페이지 |

### 2. 거래 상세

| Item | Description |
|------|-------------|
| 체결 정보 | 체결 시간, 체결가, 수량 |
| 신호 정보 | 매매 트리거된 예측 신호 |
| 손익 정보 | 매입가 대비 손익 |

### 3. 수익률 리포트

| Item | Description |
|------|-------------|
| API | `GET /api/v1/users/{userId}/trades/report` |
| 기간 | 일간, 주간, 월간, 전체 |
| 표시 항목 | 아래 참조 |

#### 리포트 항목
| Metric | Description |
|--------|-------------|
| 총 거래 수 | 기간 내 체결 건수 |
| 승률 | 수익 거래 / 전체 거래 |
| 평균 수익 | 수익 거래 평균 |
| 평균 손실 | 손실 거래 평균 |
| 손익비 | 평균 수익 / 평균 손실 |
| 누적 수익 | 기간 내 총 손익 |

### 4. 신호 실행 내역

| Item | Description |
|------|-------------|
| API | `GET /api/v1/users/{userId}/trade-signals` |
| 표시 항목 | 신호 시간, 종목, 신호 유형, 실행 여부 |
| 상태 | 실행됨, 스킵됨, 실패 |

## UI Components

- `TradeHistoryTable` - 거래 내역 테이블
- `TradeDetail` - 거래 상세 모달
- `ReportCard` - 수익률 지표 카드
- `ProfitChart` - 누적 수익 차트
- `SignalExecutionList` - 신호 실행 리스트

## Acceptance Criteria

- [ ] 날짜 범위 선택 캘린더
- [ ] CSV 내보내기 기능
- [ ] 거래 클릭 시 상세 모달
- [ ] 차트 기간 변경 가능
