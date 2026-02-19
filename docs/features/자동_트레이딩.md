# Auto Trading [Draft]

자동 매매 설정 - 사용자의 자동 매매 규칙 설정

## Route

`/trading`

## Features

### 1. 자동 매매 ON/OFF

| Item | Description |
|------|-------------|
| API | `PATCH /api/v1/users/{userId}/trading-config` |
| 동작 | 전체 자동 매매 활성화/비활성화 |
| UI | 메인 토글 스위치 |
| 확인 | ON 시 경고 다이얼로그 |

### 2. 매수 조건 설정

| Setting | Description | Default |
|---------|-------------|---------|
| 최소 복합 점수 | 매수 신호 발생 기준 | 7.0 |
| 최대 보유 종목 수 | 동시 보유 가능 종목 | 5 |
| 종목당 최대 금액 | 분산 투자 한도 | 1,000,000원 |

```
API: PUT /api/v1/users/{userId}/trading-config
Body: {
  "minCompositeScore": 7.0,
  "maxStocksToBuy": 5,
  "maxAmountPerStock": 1000000
}
```

### 3. 손절/익절 설정

| Setting | Description | Default |
|---------|-------------|---------|
| 손절 비율 | 손실 시 자동 매도 | -7% |
| 익절 비율 | 이익 시 자동 매도 | +5% |

### 4. 매매 시간 설정

| Setting | Description | Default |
|---------|-------------|---------|
| 거래 시작 시간 | 매수 시작 | 09:00 |
| 거래 종료 시간 | 매수 종료 | 15:00 |
| 주말 거래 | 토/일 제외 | OFF |

### 5. 설정 프리셋

| Preset | Description |
|--------|-------------|
| 보수적 | 높은 점수, 낮은 손절 |
| 적극적 | 중간 점수, 높은 익절 |
| 커스텀 | 사용자 직접 설정 |

## UI Components

- `TradingToggle` - 메인 ON/OFF 토글
- `ScoreSlider` - 최소 점수 슬라이더
- `AmountInput` - 금액 입력 (천원 단위)
- `PercentageInput` - 손절/익절 % 입력
- `PresetSelector` - 프리셋 선택 카드
- `SettingsSummary` - 현재 설정 요약

## Acceptance Criteria

- [ ] 설정 변경 즉시 저장 (auto-save)
- [ ] 유효성 검사 (0~10 점수, 양수 금액)
- [ ] 자동 매매 ON 시 KIS 계좌 연동 확인
- [ ] 설정 변경 히스토리 조회 가능
