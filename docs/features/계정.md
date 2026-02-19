# Account [Draft]

증권사 계좌 연동 - KIS (한국투자증권) API 연동 관리

## Route

`/account`

## Features

### 1. KIS 계좌 등록

| Item | Description |
|------|-------------|
| API | `POST /api/v1/users/{userId}/kis-accounts` |
| 입력 항목 | App Key, App Secret, 계좌번호 |
| 검증 | 연결 테스트 후 저장 |

```
Body: {
  "appKey": "PSxxx...",
  "appSecret": "xxx...",
  "accountNumber": "12345678-01",
  "accountType": "01"  // 01: 주식, 02: 선물옵션
}
```

### 2. 계좌 정보 조회

| Item | Description |
|------|-------------|
| API | `GET /api/v1/users/{userId}/kis-accounts` |
| 표시 항목 | 계좌번호 (마스킹), 연결 상태, 등록일 |
| 상태 | 활성/비활성/오류 |

### 3. 계좌 활성화/비활성화

| Item | Description |
|------|-------------|
| API | `PATCH /api/v1/users/{userId}/kis-accounts/toggle` |
| 동작 | 거래 가능 상태 토글 |
| 용도 | 일시적 거래 중단 |

### 4. 실시간 잔고 조회

| Item | Description |
|------|-------------|
| API | `GET /api/v1/users/{userId}/balance` |
| 표시 항목 | 아래 참조 |

#### 잔고 정보
| Field | Description |
|-------|-------------|
| 예수금 | 현금 잔액 |
| 총 평가금액 | 보유 주식 + 예수금 |
| 보유 종목 | 종목별 수량, 평균단가, 현재가, 손익 |
| 총 손익 | 전체 평가 손익 |
| 수익률 | 전체 수익률 % |

### 5. 계좌 삭제

| Item | Description |
|------|-------------|
| API | `DELETE /api/v1/users/{userId}/kis-accounts` |
| 확인 | 2단계 확인 (비밀번호 + 문구 입력) |
| 동작 | 연동 해제, 자동 매매 중단 |

## UI Components

- `AccountRegistrationForm` - 계좌 등록 폼
- `AccountCard` - 계좌 정보 카드
- `BalanceOverview` - 잔고 요약
- `HoldingsList` - 보유 종목 리스트
- `ConnectionStatus` - 연결 상태 뱃지

## Security

- App Secret은 입력 후 마스킹 표시
- 저장 시 서버에서 암호화
- 계좌번호 일부 마스킹 (****5678-01)

## Acceptance Criteria

- [ ] 계좌 등록 시 연결 테스트 필수
- [ ] 민감 정보 마스킹 처리
- [ ] 잔고 새로고침 버튼 제공
- [ ] 계좌 삭제 시 2단계 확인
