# Stock Analysis [Draft]

종목 분석 - 개별 종목의 기술적/감성 분석 정보 조회

## Routes

- `/stocks` - 종목 목록
- `/stocks/[symbol]` - 종목 상세

## Features

### 1. 종목 목록 (`/stocks`)

| Item | Description |
|------|-------------|
| API | `GET /api/v1/stocks` |
| 표시 항목 | 티커, 종목명, 섹터, 최신 신호 |
| 검색 | 종목명/티커 검색 |
| 필터 | 섹터별, ETF 여부, 신호별 |
| 정렬 | 이름순, 신뢰도순, 최근 분석순 |

### 2. 종목 상세 (`/stocks/[symbol]`)

| Item | Description |
|------|-------------|
| API | `GET /api/v1/predictions/{symbol}` |
| 표시 항목 | 아래 섹션 참조 |

#### 2.1 기본 정보
- 종목명, 티커, 섹터
- 현재가, 전일 대비
- 예측 신호 (BUY/SELL/HOLD)
- 신뢰도 점수

#### 2.2 기술적 지표
| Indicator | Description |
|-----------|-------------|
| SMA | 20일, 50일, 200일 이동평균 |
| RSI | 상대강도지수 (과매수/과매도) |
| MACD | MACD, Signal, Histogram |
| Bollinger | 상단/하단 밴드 |
| Volume | 거래량, 평균 거래량 대비 |

#### 2.3 감성 분석
- 뉴스 감성 점수 (-1.0 ~ +1.0)
- 최근 뉴스 헤드라인 (있는 경우)

#### 2.4 복합 점수
- 기술적 점수 (70%)
- 감성 점수 (30%)
- 최종 복합 점수 (0~10)

### 3. 히스토리 조회

| Item | Description |
|------|-------------|
| API | `GET /api/v1/predictions/{symbol}?days=30` |
| 차트 | 예측 신호 변화 추이 |
| 테이블 | 일자별 예측 결과 |

## UI Components

- `StockList` - 종목 목록 테이블
- `StockSearch` - 검색 입력
- `StockFilter` - 필터 드롭다운
- `TechnicalIndicators` - 지표 카드 그리드
- `SentimentGauge` - 감성 점수 게이지
- `PredictionChart` - 예측 추이 차트

## Acceptance Criteria

- [ ] 종목 검색 시 300ms 디바운스
- [ ] 필터 상태 URL 파라미터 유지
- [ ] 지표별 상태 색상 표시 (위험/중립/양호)
- [ ] 차트 날짜 범위 선택 가능
