# CLAUDE.md - Frontend

이 파일은 Frontend 프로젝트 작업 시 Claude Code가 참고하는 가이드입니다.
Backoffice도 동일한 규칙을 따릅니다 (포트만 4000으로 다름).

## 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 (포트 3000)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start

# 린트 검사
pnpm lint
```

## 기술 스택

| 항목          | 기술                      |
| ------------- | ------------------------- |
| 프레임워크    | Next.js 15 (App Router)   |
| UI 라이브러리 | React 19                  |
| 언어          | TypeScript (필수)         |
| 스타일링      | Tailwind CSS 4            |
| UI 컴포넌트   | Shadcn/ui + Radix UI      |
| 폼 처리       | React Hook Form + Zod     |
| 인증          | Supabase Auth             |
| 결제          | TossPayments API          |
| 코드 품질     | ESLint + Prettier + Husky |

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈페이지
│   ├── auth/                   # 인증 페이지
│   │   └── page.tsx
│   ├── recommendations/        # 종목 추천 페이지
│   │   └── page.tsx
│   ├── strategies/             # 전략 마켓플레이스
│   ├── stocks/                 # 종목 탐색
│   ├── payment/                # 결제 페이지
│   │   └── page.tsx
│   └── api/                    # API 라우트
│       ├── payments/           # 결제 승인 API
│       └── predictions/        # 종목 추천 API (프록시)
│           └── buy-signals/
│
├── components/                 # React 컴포넌트
│   ├── ui/                     # Shadcn/ui 기본 컴포넌트
│   ├── auth/                   # 인증 관련 컴포넌트
│   ├── payment/                # 결제 관련 컴포넌트
│   ├── seo/                    # SEO 컴포넌트
│   ├── pwa/                    # PWA 관련 컴포넌트
│   └── layout/                 # 레이아웃 컴포넌트
│       └── Header.tsx          # 네비게이션 헤더
│
├── lib/                        # 유틸리티
│   ├── api/                    # API 클라이언트
│   │   ├── predictions.ts      # 종목 추천 API 클라이언트
│   │   └── strategies.ts       # 전략 API 클라이언트
│   ├── supabase.ts             # Supabase 클라이언트
│   ├── toss-payments.ts        # TossPayments 설정
│   └── utils.ts                # 공통 유틸
│
├── hooks/                      # 커스텀 훅
│   ├── useAuth.ts              # 인증 상태 훅
│   └── usePayment.ts           # 결제 훅
│
├── contexts/                   # React Context
│   └── AuthContext.tsx         # 인증 컨텍스트
│
└── types/                      # TypeScript 타입
    └── index.ts
```

## 디자인 시스템

### 색상 팔레트 (다크 테마 기본)

```css
/* 배경 */
--background: slate-900 --card: slate-800/50 --border: slate-700 /* 강조색 */ --primary: emerald-400
  ~emerald-600 --accent: cyan-400 /* 텍스트 */ --foreground: white --muted: slate-300 ~slate-400;
```

### 컴포넌트 사용

```tsx
// Shadcn/ui 컴포넌트 import
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

## 인증 (Supabase)

### 파일 구조

- `lib/supabase.ts`: Supabase 클라이언트 초기화
- `hooks/useAuth.ts`: 인증 상태 관리 훅
- `contexts/AuthContext.tsx`: 인증 컨텍스트 프로바이더
- `components/auth/`: 로그인/회원가입 컴포넌트

### 인증 훅 사용

```tsx
import { useAuth } from '@/hooks/useAuth';

function Component() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>로그인이 필요합니다</div>;

  return <div>환영합니다, {user.email}</div>;
}
```

### 보안 규칙

- JWT 토큰은 httpOnly 쿠키에 저장
- 민감한 처리는 서버 사이드에서만
- RLS(Row Level Security) 정책 활용

## 결제 (TossPayments)

### 파일 구조

- `lib/toss-payments.ts`: TossPayments SDK 설정
- `hooks/usePayment.ts`: 결제 요청 훅
- `components/payment/`: 결제 UI 컴포넌트
- `app/api/payments/`: 결제 승인 API

### 결제 흐름

1. 클라이언트: 결제 정보 입력
2. 클라이언트: TossPayments 결제창 호출
3. **서버**: 결제 승인 요청 (API Route)
4. 클라이언트: 결과 처리

### 보안 규칙

- 결제 승인은 반드시 서버에서 처리 (`app/api/payments/`)
- 주문번호는 UUID 등 예측 불가능한 값 사용
- 결제 금액은 서버에서 재검증

### 테스트 카드

```
카드번호: 4330-1234-1234-1234
유효기간: 아무 미래 날짜
CVC: 아무 3자리
```

## 코딩 규칙

### TypeScript 필수

```tsx
// ✅ 타입 명시
interface Props {
  title: string;
  onClick: () => void;
}

// ❌ any 사용 금지
const data: any = fetchData();
```

### 컴포넌트 패턴

```tsx
// 함수형 컴포넌트 + TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={cn('px-4 py-2', variant === 'primary' && 'bg-emerald-600')}>
      {children}
    </button>
  );
}
```

### 파일 네이밍

```
컴포넌트: PascalCase (Button.tsx, UserCard.tsx)
훅: camelCase + use 접두사 (useAuth.ts, usePayment.ts)
유틸: camelCase (utils.ts, supabase.ts)
```

### 한글 주석 권장

```tsx
// 사용자 인증 상태를 확인하고 리다이렉트 처리
if (!user) {
  router.push('/auth');
}
```

## 환경 변수

`.env.local`:

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# TossPayments (필수)
NEXT_PUBLIC_TOSS_CLIENT_KEY=    # 클라이언트 키 (test_ck_* 또는 live_ck_*)
TOSS_SECRET_KEY=                 # 시크릿 키 (서버 전용)

# SEO
NEXT_PUBLIC_SITE_URL=https://alphafoundry.co.kr
```

## 커밋 규칙

Husky + Commitlint 설정됨:

```bash
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
```

## 테스트 규칙

상세: **[TESTING_RULES.md](./TESTING_RULES.md)** 참조

- 개발 테스트: `pnpm dev` (핫 리로드) / 통합: `./start.sh --dev --build`
- 테스트 전 플랜 작성, E2E 화면 테스트 필수 (Playwright MCP)
- 테스트 완료 후 결과 보고

## Backoffice 차이점

| 항목            | Frontend    | Backoffice      |
| --------------- | ----------- | --------------- |
| 포트            | 3000        | 4000            |
| 대상 사용자     | 일반 사용자 | 운영자/관리자   |
| 추가 라이브러리 | -           | recharts (차트) |
| 기타            | 동일        | 동일            |

Backoffice 실행:

```bash
cd quant-jump-stock-backoffice
pnpm dev  # 포트 4000
```

## 종목 추천 시스템

### 개요
AI 기반 종목 추천 기능으로, 기술적 지표를 분석하여 매수 신호를 제공합니다.

### 파일 구조
- **API 클라이언트**: `lib/api/predictions.ts`
  - `getBuySignals()`: 매수 신호 조회
  - `getConfidenceGrade()`: 신뢰도 등급 변환
  - `getScoreGrade()`: 종합 점수 등급 변환
- **API 프록시**: `app/api/predictions/buy-signals/route.ts` (CORS 우회)
- **페이지**: `app/recommendations/page.tsx`

### 점수 시스템 (BETA)

**현재 상태** (2026-02-13):
- AI 예측 및 감정 분석 **미통합**
- 기술적 지표만 사용 → `composite_score` 최대 1.4점
- 통합 후 예상 최대: 7.5점

**점수 계산식**:
```text
composite_score = 0.3 × rise_probability + 0.4 × tech_conditions + 0.3 × sentiment
tech_conditions = 1.5 × golden_cross + 1.0 × (rsi < 50) + 1.0 × macd_buy_signal
```

**등급 기준** (`lib/api/predictions.ts`):
```typescript
// 신뢰도 등급
CONFIDENCE_GRADE_THRESHOLDS = {
  VERY_HIGH: 0.9,  // 매우 높음
  HIGH: 0.8,       // 높음
  MEDIUM: 0.7      // 중간
}

// 종합 점수 등급 (현재: AI/감정 미통합)
COMPOSITE_SCORE_GRADE_THRESHOLDS.CURRENT = {
  EXCELLENT: 1.2,  // 우수 (85%ile)
  GOOD: 0.8,       // 양호 (57%ile)
  FAIR: 0.5        // 보통 (35%ile)
}

// 통합 후 예상 기준
COMPOSITE_SCORE_GRADE_THRESHOLDS.FUTURE = {
  EXCELLENT: 6.0,  // 우수
  GOOD: 4.0,       // 양호
  FAIR: 2.0        // 보통
}
```

### Admin 관리 계획
점수 기준은 Backoffice Admin 페이지에서 동적 관리 예정:
- 신뢰도/종합 점수 임계값 조정
- 현재/통합 모드 전환 (CURRENT ↔ FUTURE)
- 변경 이력 추적

<!-- TODO: Admin 페이지 개발 시 상세 문서 추가 예정 -->

### 사용 예시

```tsx
import { getBuySignals, getConfidenceGrade, getScoreGrade } from '@/lib/api/predictions';

// 매수 신호 조회 (신뢰도 70% 이상)
const response = await getBuySignals({ minConfidence: 0.7 });

// 등급 계산
const confidenceGrade = getConfidenceGrade(stock.confidence);
// { grade: '높음', color: 'text-cyan-400' }

const scoreGrade = getScoreGrade(stock.compositeScore);
// { grade: '양호', color: 'text-cyan-400', badge: 'BETA' }
```

### API 문서
상세 스펙: [Predictions API](../../../docs/api/predictions.md)
