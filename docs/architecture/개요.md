# Frontend 아키텍처 개요

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15.4 | App Router, SSR/SSG |
| React | 19 | UI 라이브러리 |
| TypeScript | 5.9 | 타입 안정성 |
| Tailwind CSS | 4 | 유틸리티 CSS |
| Radix UI | - | 접근성 기반 UI 프리미티브 |
| Recharts | 3.7 | 차트/데이터 시각화 |
| Axios | - | HTTP 클라이언트 |
| React Hook Form + Zod | - | 폼 관리 + 유효성 검증 |

## 디렉토리 구조

```
src/
├── app/                        # Next.js App Router (라우팅)
│   ├── layout.tsx              # 루트 레이아웃 (AuthProvider, Header, BottomNav)
│   ├── page.tsx                # 홈
│   ├── auth/                   # 로그인/회원가입
│   │   ├── page.tsx
│   │   └── callback/page.tsx   # OAuth 콜백 처리
│   ├── mypage/page.tsx         # 마이페이지
│   ├── stocks/                 # 종목 탐색
│   │   ├── page.tsx
│   │   └── [id]/page.tsx       # 종목 상세
│   ├── strategies/             # 전략 마켓플레이스
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx        # 전략 상세
│   │       └── backtest/page.tsx # 백테스트 시뮬레이터
│   └── api/                    # API Routes (백엔드 프록시)
│       ├── auth/               # 인증 API
│       ├── strategies/         # 전략 API
│       ├── stocks/             # 종목 API
│       ├── backtest/           # 백테스트 API
│       └── benchmarks/         # 벤치마크 API
│
├── components/
│   ├── ui/                     # Shadcn/ui 기본 컴포넌트
│   ├── layout/                 # Header, BottomNav
│   ├── auth/                   # LoginForm, SignUpForm
│   ├── strategies/             # StrategyCard, EquityCurveChart 등
│   ├── backtest/               # BacktestForm, PerformanceCards 등
│   ├── pwa/                    # ServiceWorker, InstallPrompt
│   └── seo/                    # MetaTags
│
├── contexts/
│   └── AuthContext.tsx          # 인증 상태 관리 (JWT)
│
├── hooks/
│   └── useAuth.ts              # AuthContext 훅
│
├── lib/
│   ├── api-client.ts           # Axios 인스턴스 (서버/클라이언트)
│   ├── api-config.ts           # API 설정 상수
│   ├── api/                    # 도메인별 API 함수
│   ├── seo/                    # SEO 설정
│   ├── utils.ts                # cn() 등 유틸
│   └── mock/                   # 목 데이터
│
└── types/                      # TypeScript 타입 정의
    ├── auth.ts
    ├── strategy.ts
    ├── api.ts
    ├── backtest.ts
    └── payment.ts
```

## API 프록시 패턴

CORS 회피를 위해 Next.js API Routes로 백엔드 호출을 프록시합니다.

```
브라우저 → Next.js API Route → Spring Boot 백엔드 (:10010)
         (Same-Origin)       (Server-to-Server)
```

### API 클라이언트 (`src/lib/api-client.ts`)

```typescript
// 서버 사이드: 백엔드 직접 호출
serverApi.baseURL = 'http://localhost:10010'

// 클라이언트 사이드: 같은 오리진 (API Route 경유)
clientApi.baseURL = '' // 상대 경로
```

- 요청 인터셉터: `localStorage`의 JWT 토큰을 `Authorization: Bearer` 헤더로 자동 주입
- 응답 인터셉터: 401/403 시 토큰 제거 후 `/auth`로 리다이렉트

## 인증 플로우

### JWT 기반 인증
1. 로그인/회원가입 → 백엔드에서 JWT 발급
2. `localStorage`에 `auth_token` 저장
3. `AuthContext`가 전역 인증 상태 관리
4. 앱 로드 시 `/api/auth/me`로 세션 검증

### OAuth2 (Google/Naver)
1. `signInWithGoogle()` → 백엔드 `/api/v1/auth/oauth2/authorize/google`로 리다이렉트
2. 백엔드가 OAuth 플로우 처리 후 `/auth/callback?token=xxx`로 리다이렉트
3. 콜백 페이지에서 토큰 추출 → `localStorage` 저장 → `/api/auth/me`로 유저 정보 조회

### AuthUser 타입
```typescript
{
  userId: string
  name?: string
  email: string
  phone?: string
  role: string      // ROLE_USER, ROLE_ADMIN
  status: string    // ACTIVE, INACTIVE
}
```

## 상태 관리

- **전역 상태**: React Context (`AuthContext`)
- **서버 상태**: API 호출 시 컴포넌트 로컬 state 사용
- **폼 상태**: React Hook Form + Zod 스키마 검증
- **별도 상태 라이브러리 없음** (Redux, Zustand 미사용)

## 스타일링

- **Tailwind CSS 4** + 커스텀 CSS 변수 (`globals.css`)
- **다크 모드 기본** (라이트 모드 미지원)
- **Shadcn/ui** 컴포넌트: `class-variance-authority`로 변형 관리
- **cn()** 유틸: `clsx` + `tailwind-merge`로 클래스 병합
- 컬러 팔레트: `slate-900` (배경), `emerald-400` (주요), `cyan-400` (보조)

## PWA 지원

- `manifest.ts` — PWA 매니페스트
- `ServiceWorkerRegister.tsx` — SW 등록
- `InstallPrompt.tsx` — 설치 배너
- `UpdatePrompt.tsx` — 업데이트 알림
- `offline/page.tsx` — 오프라인 폴백

## 빌드 & 배포

- `output: 'standalone'` — Docker 배포용 독립 실행 빌드
- Husky + commitlint — Git 훅으로 커밋 메시지 검증
- ESLint + Prettier — 코드 스타일 일관성
