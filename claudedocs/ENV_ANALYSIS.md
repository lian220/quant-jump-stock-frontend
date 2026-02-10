# 환경 변수 분석 보고서

> 작성일: 2026-02-10
> 대상: quant-jump-stock (Frontend + Backend)

---

## 1. 파일 구조 개요

### Frontend (`quant-jump-stock-frontend/`)

| 파일 | 용도 |
|------|------|
| `.env.local` | 로컬 개발 |
| `.env.prod` | 운영 환경 |
| `.env.example` | 템플릿 (새 개발자용) |

### Backend (`quant-jump-stock-backend/`)

| 파일 | 용도 | 로드 순서 |
|------|------|----------|
| `.env.common` | 공통 (개발/운영 공용) | 1순위 |
| `.env.local` | 로컬 개발 오버라이드 | 2순위 |
| `.env.prod` | 운영 환경 오버라이드 | 2순위 |

> Backend는 `start.sh`에서 `.env.common` 먼저 로드 후 `.env.local` 또는 `.env.prod`로 오버라이드하는 방식.

---

## 2. Frontend 환경 변수

### 2-1. 코드에서 실제 사용하는 변수

#### 클라이언트 사이드 (브라우저 노출 - `NEXT_PUBLIC_` 접두사)

| 변수 | 사용처 | 설명 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | AuthContext, api-client, api-config 등 | 백엔드 API 기본 URL |
| `NEXT_PUBLIC_SITE_URL` | layout.tsx, sitemap.ts, robots.ts, seo/config | SEO 메타 + OG 이미지 URL |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | lib/toss-payments.ts | Toss 결제 위젯 클라이언트 키 |
| `NEXT_PUBLIC_NAVER_PAY_CLIENT_ID` | lib/naver-pay.ts, payments/naver/reserve | 네이버페이 클라이언트 ID |
| `NEXT_PUBLIC_NAVER_PAY_MERCHANT_ID` | lib/naver-pay.ts | 네이버페이 가맹점 ID |
| `NEXT_PUBLIC_NAVER_PAY_CHAIN_ID` | lib/naver-pay.ts, payments/naver/reserve | 네이버페이 체인 ID |
| `NEXT_PUBLIC_NAVER_PAY_MODE` | lib/naver-pay.ts, payments/naver/reserve | 네이버페이 모드 (development/production) |
| `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` | components/ads/AdSense.tsx | Google 광고 클라이언트 ID |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | layout.tsx | Google 사이트 인증 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | layout.tsx | Naver 사이트 인증 |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | (OAuth - .env.prod에만 정의) | 네이버 로그인 (미사용 가능성) |

#### 서버 사이드 (API Route 전용 - 브라우저 노출 안됨)

| 변수 | 사용처 | 설명 |
|------|--------|------|
| `API_URL` | 모든 API Route (auth, strategies, stocks 등) | 백엔드 직접 호출 URL (Docker 내부 등) |
| `TOSS_SECRET_KEY` | api/payments/confirm/route.ts | Toss 결제 승인 시크릿 키 |
| `NAVER_PAY_CLIENT_SECRET` | api/payments/naver/reserve/route.ts | 네이버페이 시크릿 키 |
| `NODE_ENV` | ServiceWorkerRegister, AdSense | 환경 구분 (development/production) |

### 2-2. 파일별 정의 현황

| 변수 | `.env.local` | `.env.prod` | `.env.example` |
|------|:---:|:---:|:---:|
| `NEXT_PUBLIC_API_URL` | `http://localhost:10010` | `https://api.alphafoundry.app` | `http://localhost:10010` |
| `NEXT_PUBLIC_SITE_URL` | - | `https://alphafoundry.app` | `http://localhost:3000` |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | **누락** | `test_ck_D5Ge...` | placeholder |
| `TOSS_SECRET_KEY` | **누락** | `test_sk_zXLk...` | placeholder |
| `NEXT_PUBLIC_NAVER_PAY_CLIENT_ID` | `HN3GGC...` | `HN3GGC...` | **누락** |
| `NEXT_PUBLIC_NAVER_PAY_MERCHANT_ID` | `np_ckfcy...` | `np_ckfcy...` | **누락** |
| `NEXT_PUBLIC_NAVER_PAY_CHAIN_ID` | `dkpBZT...` | `dkpBZT...` | **누락** |
| `NEXT_PUBLIC_NAVER_PAY_MODE` | `development` | `development` | **누락** |
| `NAVER_PAY_CLIENT_SECRET` | `ftZjkk...` | `ftZjkk...` | **누락** |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | **누락** | `TuWIud...` | **누락** |
| `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` | **누락** | (비어있음) | placeholder |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | **누락** | **누락** | **누락** |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | **누락** | **누락** | **누락** |

---

## 3. Backend 환경 변수

### 3-1. `.env.common` (공통)

개발/운영 환경 모두에서 로드. 이후 `.env.local` 또는 `.env.prod`가 오버라이드.

| 카테고리 | 변수 | 비고 |
|---------|------|------|
| **Slack** | `SLACK_WEBHOOK_URL_TRADING` | 트레이딩 알림 |
| | `SLACK_WEBHOOK_URL_ANALYSIS` | 분석 알림 |
| | `SLACK_WEBHOOK_URL_SCHEDULER` | 스케줄러 알림 |
| | `SLACK_WEBHOOK_URL_ERROR` | 에러 알림 |
| | `SLACK_BOT_TOKEN` | Slack 봇 |
| | `SLACK_ENABLED=true` | |
| | `SLACK_CHANNEL` | |
| **외부 API** | `FRED_API_KEY` | 미국 경제지표 |
| | `ALPHA_VANTAGE_API_KEY` | (코드에서 미사용 가능성) |
| **보안** | `APP_ENCRYPTION_KEY` | AES-256 암호화 키 |
| **GCP** | `GCP_ENABLED=true` | |
| | `GCP_PROJECT_ID` | |
| | `GCP_REGION=us-central1` | |
| | `GCP_BUCKET_NAME` | |
| **Vertex AI** | `VERTEX_AI_MACHINE_TYPE` | ML 학습 설정 |
| | `VERTEX_AI_GPU_*` | |
| | `VERTEX_AI_DB_*` | Supabase PostgreSQL (Vertex용) |
| | `VERTEX_AI_MONGO*` | MongoDB Atlas (Vertex용) |
| **인증** | `GOOGLE_APPLICATION_CREDENTIALS` | GCP 서비스 계정 키 경로 |

### 3-2. `.env.local` vs `.env.prod` 비교

| 변수 | `.env.local` | `.env.prod` |
|------|-------------|-------------|
| **ENVIRONMENT** | `local` | `prod` |
| **LOG_LEVEL** | `DEBUG` | `INFO` |
| **DB_HOST** | `postgresql` (Docker) | `aws-1-ap-southeast-2.pooler.supabase.com` |
| **DB_NAME** | `quantiq` | `postgres` |
| **DB_USER** | `quantiq_user` | `postgres.otfgfjrpliqqzcrsigoe` |
| **DB_PASSWORD** | `quantiq_password` | `lian0220C1!` |
| **MONGODB_URI** | `mongodb://...@mongodb:27017/...` (Docker) | `mongodb+srv://...@cluster-test.2dkjwjs.mongodb.net/...` (Atlas) |
| **NAVER_REDIRECT_URI** | `http://localhost:10010/...` | `https://api.alphafoundry.app/...` |
| **OAUTH_FRONTEND_REDIRECT_URL** | `http://localhost:3000/auth/callback` | `https://alphafoundry.app/auth/callback` |
| **GOOGLE_REDIRECT_URI** | `http://localhost:10010/...` | `https://api.alphafoundry.app/...` |
| **JWT_SECRET** | `quant-jump-stock-local-dev-secret...` | `r8mZKcXmfSaghzSTLW7U99f/Julvs...` |
| **CORS_ALLOWED_ORIGINS** | `http://localhost:3000,http://localhost:4000` | `https://alphafoundry.app,https://api.alphafoundry.app` |
| **SWAGGER_ENABLED** | `true` | `true` |
| **NAVER_PAY_CLIENT_ID** | `ut0vP1s6...` | `HN3GGCMDd...` |
| **NAVER_PAY_CLIENT_SECRET** | `WhGp51J04e` | `ftZjkkRNMR` |
| **NAVER_CLIENT_ID** | `TuWIud...` | `TuWIud...` (동일) |
| **NAVER_CLIENT_SECRET** | `RbjFo7xJPH` | `RbjFo7xJPH` (동일) |
| **GOOGLE_CLIENT_ID** | (비어있음) | (비어있음) |
| **KIS_BASE_URL** | **누락** | `https://openapi.koreainvestment.com:9443` |

---

## 4. Frontend-Backend 간 불일치

### 4-1. 네이버페이 Client ID 불일치

| | Frontend | Backend |
|---|---------|---------|
| **로컬** | `HN3GGCMDdTgGUfl0kFCo` | `ut0vP1s6_Kzi_Z4aiZcp` |
| **운영** | `HN3GGCMDdTgGUfl0kFCo` | `HN3GGCMDdTgGUfl0kFCo` |

> 로컬에서 Frontend와 Backend의 네이버페이 Client ID가 다름. 결제 연동 시 문제 발생 가능.

### 4-2. 네이버페이 Client Secret 불일치

| | Frontend | Backend |
|---|---------|---------|
| **로컬** | `ftZjkkRNMR` | `WhGp51J04e` |
| **운영** | `ftZjkkRNMR` | `ftZjkkRNMR` |

> 로컬에서 Secret도 다름. 운영에서는 일치.

### 4-3. 네이버 OAuth Client ID

| | Frontend | Backend |
|---|---------|---------|
| **로컬** | **누락** | `TuWIudUKn0E7G7oQ7uOb` |
| **운영** | `TuWIudUKn0E7G7oQ7uOb` | `TuWIudUKn0E7G7oQ7uOb` |

> Frontend .env.local에 Naver OAuth 설정이 없어 로컬 소셜 로그인 테스트 불가.

### 4-4. Toss Payments

| | Frontend | Backend |
|---|---------|---------|
| **로컬** | **누락** | (사용 안 함) |
| **운영** | `test_ck_D5Ge...` / `test_sk_zXLk...` | (사용 안 함) |

> Frontend 전용 결제 키. .env.local에 없어서 로컬 결제 테스트 불가.
> 주의: .env.prod에서도 아직 `test_` 접두사 키 사용 중 (라이브 키 아님).

---

## 5. 문제점 및 개선사항

### 즉시 수정 필요

| # | 항목 | 심각도 | 내용 |
|---|------|--------|------|
| 1 | **Frontend .env.local 누락** | 높음 | Toss 키, Naver OAuth 미설정 → 로컬 결제/소셜 로그인 불가 |
| 2 | **네이버페이 로컬 불일치** | 높음 | Frontend/Backend Client ID/Secret 다름 → 결제 실패 |
| 3 | **Backend .env.common 보안** | 높음 | Slack 토큰, DB 비밀번호, GCP 키 평문 노출 |
| 4 | **운영 Swagger 활성화** | 중간 | `.env.prod`에서 `SWAGGER_ENABLED=true` → API 스펙 노출 |
| 5 | **Toss 운영 키가 test 키** | 중간 | `.env.prod`에 `test_ck_`/`test_sk_` 사용 중 → 실결제 불가 |

### 개선 권장

| # | 항목 | 내용 |
|---|------|------|
| 6 | `.env.example` 업데이트 | Naver Pay, Site Verification 변수 누락 |
| 7 | `ALPHA_VANTAGE_API_KEY` | 코드에서 미사용 → 제거 검토 |
| 8 | Google OAuth | Frontend/Backend 모두 Client ID 비어있음 → 미구현 상태 |
| 9 | `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` | .env.prod에서 비어있음 → 광고 미노출 |
| 10 | Google/Naver Site Verification | 어디에도 값 미설정 → SEO 인증 미완료 |

---

## 6. 권장 .env.local (Frontend)

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:10010

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Toss Payments (테스트 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R

# Naver Pay (Backend .env.local과 일치시킬 것)
NEXT_PUBLIC_NAVER_PAY_CLIENT_ID=HN3GGCMDdTgGUfl0kFCo
NEXT_PUBLIC_NAVER_PAY_MERCHANT_ID=np_ckfcy018981
NEXT_PUBLIC_NAVER_PAY_CHAIN_ID=dkpBZTduNHFWTi9
NEXT_PUBLIC_NAVER_PAY_MODE=development
NAVER_PAY_CLIENT_SECRET=ftZjkkRNMR

# Naver OAuth (로컬 테스트)
NEXT_PUBLIC_NAVER_CLIENT_ID=TuWIudUKn0E7G7oQ7uOb

# Google AdSense (로컬에서는 비활성화)
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=
```

---

## 7. 변수 흐름도

```
[브라우저]
  │
  │ NEXT_PUBLIC_API_URL (빈 문자열 = same-origin)
  │
  ├─→ /api/auth/login ─────→ API_URL/api/v1/auth/login
  ├─→ /api/strategies ──────→ API_URL/api/v1/marketplace/strategies
  ├─→ /api/stocks ──────────→ API_URL/api/v1/marketplace/stocks
  ├─→ /api/backtest/run ────→ API_URL/api/v1/backtest/run
  ├─→ /api/payments/confirm → TOSS_SECRET_KEY 사용
  └─→ /api/payments/naver/  → NAVER_PAY_CLIENT_SECRET 사용
  │
  │ [Next.js API Routes (서버)]
  │   API_URL = process.env.API_URL || NEXT_PUBLIC_API_URL || 'http://localhost:10010'
  │
  └─→ [Backend :10010]
        JWT_SECRET, DB_*, MONGODB_URI, NAVER_CLIENT_*, CORS_ALLOWED_ORIGINS ...
```
