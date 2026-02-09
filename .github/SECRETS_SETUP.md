# GitHub Secrets 설정 - Frontend

Frontend (Cloud Run) 배포를 위해 필요한 GitHub Secrets 설정 가이드입니다.

## 필수 GitHub Secrets

> **설정 위치**: GitHub Repository → Settings → Secrets and variables → Actions

### 1. GCP 인증

| Secret 이름 | 설명 | 확인 방법 |
|-------------|------|-----------|
| **GCP_PROJECT_ID** | GCP 프로젝트 ID | Backend 저장소의 `terraform` 디렉토리에서:<br>`terraform output -raw github_actions_sa_email \| cut -d'@' -f2 \| cut -d'.' -f1` |
| **GCP_SA_KEY** | Service Account JSON 키 | `terraform output -raw github_actions_sa_key \| base64 -d` |

### 2. Backend API 연결

| Secret 이름 | 설명 | 예시 값 |
|-------------|------|---------|
| **API_BASE_URL** | Backend API URL | `https://api.alphafoundry.app` |

### 3. 외부 서비스 (선택)

| Secret 이름 | 설명 | 비고 |
|-------------|------|------|
| NEXT_PUBLIC_SITE_URL | Frontend 사이트 URL | Cloud Run URL 또는 커스텀 도메인 |
| NEXT_PUBLIC_TOSS_CLIENT_KEY | Toss Payments 클라이언트 키 | 결제 기능 사용 시 |
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL | 인증 기능 사용 시 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon 키 | 인증 기능 사용 시 |
| NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID | Google Adsense | 광고 사용 시 |
| NEXT_PUBLIC_NAVER_PAY_* | 네이버페이 관련 | 네이버페이 사용 시 |

## 현재 설정 상태

```bash
# GitHub Secrets 확인
gh secret list --repo YOUR_USERNAME/quant-jump-stock-frontend

# 현재 설정된 Secrets:
# ✓ API_BASE_URL
# ✓ AR_REPO (자동 생성 가능하므로 선택)
# ✓ GCP_PROJECT_ID
# ✓ GCP_SA_KEY
```

## 설정 방법

### 수동 설정

1. **Terraform 정보 추출** (Backend 저장소에서)
```bash
cd /path/to/quant-jump-stock/terraform
terraform output -raw github_actions_sa_key | base64 -d > /tmp/sa-key.json
cat /tmp/sa-key.json  # 복사
rm /tmp/sa-key.json   # 즉시 삭제
```

2. **GitHub 웹사이트에서 등록**
   - https://github.com/YOUR_USERNAME/quant-jump-stock-frontend/settings/secrets/actions
   - 필수 Secrets 등록:
     - `GCP_PROJECT_ID` = `focal-limiter-486614-u8` (또는 본인 프로젝트 ID)
     - `GCP_SA_KEY` = (위에서 복사한 JSON 전체 내용)
     - `API_BASE_URL` = `https://api.alphafoundry.app`

3. **선택 Secrets 등록**
   - 로컬 `.env.local` 파일에 있는 값을 GitHub Secrets에 등록
   - `NEXT_PUBLIC_*` 접두사가 붙은 변수들

## 로컬 개발 환경

로컬 개발을 위해 `.env.local` 파일 생성:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:10010
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

**주의**: `.env.local`은 `.gitignore`에 포함되어 있으므로 커밋되지 않습니다.

## 배포 흐름

```
git push origin main
    ↓
GitHub Actions
    ↓
Docker 이미지 빌드 (환경변수 주입)  ← ⚠️ 여기서 GitHub Secrets 사용
    ↓
Artifact Registry에 Push
    ↓
Cloud Run 배포 (자동 스케일링)
```

**중요**: Frontend는 Secret Manager를 사용하지 않고, 빌드 시 GitHub Secrets를 주입합니다!

## 환경변수 주의사항

### `NEXT_PUBLIC_*` 접두사

- `NEXT_PUBLIC_` 접두사가 붙은 변수는 **클라이언트에 노출**됩니다
- 민감한 키(Secret Key, Admin Token 등)는 `NEXT_PUBLIC_` 사용 금지
- 예:
  - ✅ `NEXT_PUBLIC_API_URL` (공개 가능)
  - ✅ `NEXT_PUBLIC_TOSS_CLIENT_KEY` (클라이언트 키)
  - ❌ `TOSS_SECRET_KEY` (서버 전용, 접두사 없음)

## 확인 방법

```bash
# 1. GitHub Secrets 확인
gh secret list --repo YOUR_USERNAME/quant-jump-stock-frontend

# 2. 배포된 Cloud Run 서비스 확인
gcloud run services list --region=asia-northeast3

# 3. 배포된 Frontend 접속
curl -I https://qjs-frontend-xxx.run.app

# 4. 환경변수 확인 (브라우저 콘솔)
# 브라우저에서 F12 → Console → process.env 확인 불가 (보안상)
# 대신 API 호출이 올바른 URL로 가는지 Network 탭에서 확인
```

## 보안 주의사항

- ⚠️ `NEXT_PUBLIC_*` 변수는 클라이언트에 노출되므로 민감 정보 포함 금지
- ⚠️ API 키는 프로덕션/개발 환경 분리 관리
- ⚠️ `.env.local` 파일은 절대 Git에 커밋하지 마세요
- ⚠️ Service Account 키는 최소 권한만 부여하세요

## 문제 해결

### 배포 후 API 호출 실패
```bash
# 1. API_BASE_URL 확인
gh secret list --repo YOUR_USERNAME/quant-jump-stock-frontend | grep API_BASE_URL

# 2. 재배포 (Secrets 변경 후)
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main

# 3. 브라우저에서 Network 탭으로 API URL 확인
```

### Cloud Run 배포 실패
```bash
# GitHub Actions 로그 확인
# 일반적인 원인:
# 1. GCP_SA_KEY가 잘못됨 → Backend의 terraform output으로 재확인
# 2. GCP_PROJECT_ID가 틀림 → terraform output으로 확인
# 3. 이미지 빌드 실패 → 로컬에서 `pnpm build` 테스트
```

## 관련 문서

- 전체 배포 가이드: Backend 저장소의 `/docs/technical/implemented/gcp-deployment.md`
- Backend 설정: `quant-jump-stock-backend/.github/SECRETS_SETUP.md`
- Backoffice 설정: `quant-jump-stock-backoffice/.github/SECRETS_SETUP.md` (동일)
