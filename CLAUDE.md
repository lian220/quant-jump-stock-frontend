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

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| UI 라이브러리 | React 19 |
| 언어 | TypeScript (필수) |
| 스타일링 | Tailwind CSS 4 |
| UI 컴포넌트 | Shadcn/ui + Radix UI |
| 폼 처리 | React Hook Form + Zod |
| 인증 | Supabase Auth |
| 결제 | TossPayments API |
| 코드 품질 | ESLint + Prettier + Husky |

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈페이지
│   ├── auth/                   # 인증 페이지
│   │   └── page.tsx
│   ├── payment/                # 결제 페이지
│   │   └── page.tsx
│   └── api/                    # API 라우트
│       └── payments/           # 결제 승인 API
│
├── components/                 # React 컴포넌트
│   ├── ui/                     # Shadcn/ui 기본 컴포넌트
│   ├── auth/                   # 인증 관련 컴포넌트
│   ├── payment/                # 결제 관련 컴포넌트
│   └── seo/                    # SEO 컴포넌트
│
├── lib/                        # 유틸리티
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
--background: slate-900
--card: slate-800/50
--border: slate-700

/* 강조색 */
--primary: emerald-400 ~ emerald-600
--accent: cyan-400

/* 텍스트 */
--foreground: white
--muted: slate-300 ~ slate-400
```

### 컴포넌트 사용
```tsx
// Shadcn/ui 컴포넌트 import
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
```

## 인증 (Supabase)

### 파일 구조
- `lib/supabase.ts`: Supabase 클라이언트 초기화
- `hooks/useAuth.ts`: 인증 상태 관리 훅
- `contexts/AuthContext.tsx`: 인증 컨텍스트 프로바이더
- `components/auth/`: 로그인/회원가입 컴포넌트

### 인증 훅 사용
```tsx
import { useAuth } from "@/hooks/useAuth"

function Component() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) return <div>로딩 중...</div>
  if (!user) return <div>로그인이 필요합니다</div>

  return <div>환영합니다, {user.email}</div>
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
  title: string
  onClick: () => void
}

// ❌ any 사용 금지
const data: any = fetchData()
```

### 컴포넌트 패턴
```tsx
// 함수형 컴포넌트 + TypeScript
interface ButtonProps {
  variant?: "primary" | "secondary"
  children: React.ReactNode
}

export function Button({ variant = "primary", children }: ButtonProps) {
  return (
    <button className={cn("px-4 py-2", variant === "primary" && "bg-emerald-600")}>
      {children}
    </button>
  )
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
  router.push("/auth")
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
NEXT_PUBLIC_SITE_URL=https://quantjump.co.kr
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

## Backoffice 차이점

| 항목 | Frontend | Backoffice |
|------|----------|------------|
| 포트 | 3000 | 4000 |
| 대상 사용자 | 일반 사용자 | 운영자/관리자 |
| 추가 라이브러리 | - | recharts (차트) |
| 기타 | 동일 | 동일 |

Backoffice 실행:
```bash
cd quant-jump-stock-backoffice
pnpm dev  # 포트 4000
```
