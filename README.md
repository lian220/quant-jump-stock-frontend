# 📈 Alpha Foundry - AI 기반 스마트 투자 플랫폼

데이터로 **스마트하게** 투자하세요

> AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하는 퀀트 투자 플랫폼

## 📋 개요

Alpha Foundry는 감정이 아닌 데이터 기반의 체계적인 투자를 지원하는 AI 퀀트 투자 플랫폼입니다.

### ✨ 핵심 기능

- 📊 **실시간 시세** - 국내외 주식 실시간 시세 및 차트
- 🤖 **AI 퀀트 분석** - 머신러닝 기반 종목 분석 및 투자 신호
- 📈 **백테스팅** - 과거 데이터 기반 전략 검증 시스템
- 🔔 **알림 시스템** - 맞춤형 매매 신호 및 포트폴리오 알림
- 💳 **구독 결제** - 토스페이먼츠 기반 프리미엄 플랜
- 🔐 **보안 인증** - Supabase 기반 안전한 사용자 인증

## 🛠️ 기술 스택

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui**

### Backend & 인증

- **Supabase** (PostgreSQL + Auth)
- **토스페이먼츠** API
- **Row Level Security** (RLS)

### 도구 & 배포

- **Vercel** 배포
- **ESLint + Prettier** 코드 품질
- **Husky + Commitlint** Git 훅

## 🚀 빠른 시작

### 1. 프로젝트 설정

```bash
# 프로젝트 복제
git clone https://github.com/lian220/quant-jump-stock-frontend.git
cd quant-jump-stock-frontend

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 실제 값으로 수정

# 개발 서버 실행
pnpm run dev
```

### 2. 브라우저에서 확인

- 홈페이지: [http://localhost:3000](http://localhost:3000)
- 인증 페이지: [http://localhost:3000/auth](http://localhost:3000/auth)
- 구독 플랜: [http://localhost:3000/payment](http://localhost:3000/payment)

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── auth/           # 인증 페이지
│   ├── payment/        # 결제 페이지
│   └── api/            # API 라우트
├── components/          # UI 컴포넌트
│   ├── auth/           # 인증 컴포넌트
│   ├── payment/        # 결제 컴포넌트
│   ├── seo/            # SEO 컴포넌트
│   └── ui/             # Shadcn/ui 컴포넌트
├── lib/                # 유틸리티 & 설정
├── hooks/              # 커스텀 훅
├── contexts/           # React 컨텍스트
└── types/              # TypeScript 타입
```

## 💰 구독 플랜

| 플랜          | 가격          | 기능                           |
| ------------- | ------------- | ------------------------------ |
| 베이직        | ₩29,000/월    | 기본 퀀트 분석, 알림           |
| 프로          | ₩79,000/월    | AI 분석, 백테스팅, 실시간 신호 |
| 프리미엄      | ₩149,000/월   | 모든 기능 + 1:1 투자 상담      |
| 연간 프리미엄 | ₩1,490,000/년 | 프리미엄 + 2개월 무료          |

## 🎯 개발 가이드

### 커밋 규칙

```bash
# 형식: feat|fix|docs|style|refactor|test|chore: 작업 내용
git commit -m "feat: AI 종목 분석 기능 구현"
git commit -m "fix: 실시간 시세 연동 오류 수정"
```

### 코드 스타일

- ✅ **TypeScript 필수**
- ✅ **ESLint + Prettier** 자동 적용
- ✅ **컴포넌트 재사용성** 고려
- ✅ **한글 주석** 권장

## 🌐 배포

### Vercel 배포

1. Vercel 계정 연결
2. 환경 변수 설정
3. 자동 배포 활성화

### 필수 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# SEO
NEXT_PUBLIC_SITE_URL=https://alphafoundry.co.kr
```

## ⚠️ 투자 유의사항

- 본 서비스에서 제공하는 정보는 투자 참고 자료이며, 투자 권유가 아닙니다.
- 투자에 대한 최종 결정은 투자자 본인에게 있습니다.
- 투자 손실에 대한 책임은 투자자 본인에게 있습니다.

## 🤝 라이선스

MIT License © 2025 Alpha Foundry

---

<div align="center">

**Alpha Foundry** - AI 기반 스마트 투자 플랫폼

📧 support@alphafoundry.co.kr

</div>
