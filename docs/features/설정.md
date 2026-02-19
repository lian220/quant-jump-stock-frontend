# Settings [Draft]

설정 - 사용자 프로필 및 알림 설정

## Route

`/settings`

## Features

### 1. 프로필 관리

| Item | Description |
|------|-------------|
| API | `GET/PUT /api/v1/users/{userId}` |
| 표시 항목 | 이름, 이메일, 프로필 이미지 |
| 수정 항목 | 이름, 프로필 이미지 |

### 2. 알림 설정

| Item | Description |
|------|-------------|
| API | `PUT /api/v1/users/{userId}/preferences` |
| 설정 항목 | 아래 참조 |

#### 알림 유형
| Type | Description | Default |
|------|-------------|---------|
| 매수 신호 | 신뢰도 높은 매수 신호 발생 | ON |
| 매도 신호 | 손절/익절 신호 발생 | ON |
| 체결 알림 | 주문 체결 시 | ON |
| 일일 리포트 | 매일 장 마감 후 요약 | ON |
| 시스템 알림 | 분석 완료, 오류 등 | OFF |

#### 알림 채널
| Channel | Description |
|---------|-------------|
| Slack | Slack 웹훅 연동 |
| Email | 이메일 알림 (추후) |
| Push | 브라우저 푸시 (추후) |

### 3. Slack 연동

| Item | Description |
|------|-------------|
| 입력 | Webhook URL |
| 테스트 | 테스트 메시지 발송 |
| 상태 | 연결됨/연결 안됨 |

### 4. 결제 관리

| Item | Description |
|------|-------------|
| Provider | Toss Payments |
| 표시 항목 | 현재 플랜, 결제 수단, 다음 결제일 |
| 액션 | 플랜 변경, 결제 수단 변경, 구독 취소 |

### 5. 보안 설정

| Item | Description |
|------|-------------|
| 비밀번호 변경 | Supabase Auth 연동 |
| 2FA | 2단계 인증 (추후) |
| 로그인 기록 | 최근 로그인 IP, 시간 |

### 6. 계정 관리

| Item | Description |
|------|-------------|
| 데이터 내보내기 | 거래 내역 CSV 다운로드 |
| 계정 삭제 | 회원 탈퇴 |

## UI Components

- `ProfileForm` - 프로필 수정 폼
- `NotificationToggle` - 알림 ON/OFF 토글
- `SlackIntegration` - Slack 연동 카드
- `SubscriptionCard` - 구독 정보 카드
- `SecuritySettings` - 보안 설정 섹션

## Acceptance Criteria

- [ ] 프로필 이미지 업로드 (max 2MB)
- [ ] Slack 테스트 메시지 발송
- [ ] 알림 설정 변경 즉시 저장
- [ ] 계정 삭제 시 3단계 확인
