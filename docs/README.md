# Frontend 문서

Frontend 문서는 사용자 웹앱 구현 상세를 다룹니다.  
전사 정책/공통 아키텍처는 루트 [docs](../../docs/README.md)를 기준으로 합니다.

## 문서 구조

```
docs/
├── README.md
├── architecture/         # Next.js 구조, 라우팅, 상태관리
├── features/             # 화면/도메인별 기능 명세
├── components/           # 공통 컴포넌트 가이드
├── testing/              # 테스트 전략/실행 가이드
├── deployment/           # 배포/릴리즈 절차
├── troubleshooting/      # 문제 해결 가이드
├── naver-login/          # 네이버 로그인 관련 문서
└── UX_*.md               # UX 감사 및 액션 아이템
```

## 빠른 시작

| 상황 | 문서 |
|------|------|
| 구조 이해 | [architecture](./architecture/) |
| 기능 구현 | [features](./features/README.md) |
| 컴포넌트 규칙 확인 | [components](./components/) |
| 테스트 기준 확인 | [testing](./testing/) |
| 배포 절차 확인 | [deployment](./deployment/) |
| 장애 대응 | [troubleshooting](./troubleshooting/) |

## 섹션 안내

### Architecture
- 앱 라우팅, 서버/클라이언트 경계, API 연동 방식

### Features
- 사용자 기능별 동작, API 의존성, UI 제약

### Testing
- 페이지/컴포넌트/통합 테스트 전략

### Deployment
- 환경별 배포 절차와 사전 체크리스트

### Troubleshooting
- 인증/라우팅/빌드/성능 관련 이슈 대응

## 루트 문서 연결

- [전사 문서 허브](../../docs/README.md)
- [API 계약](../../docs/api/)
- [공통 아키텍처](../../docs/architecture/)
- [테스트 규칙](../../docs/testing/테스트_규칙.md)
