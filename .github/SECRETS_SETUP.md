# GitHub Secrets 설정 - Frontend

Frontend (Cloud Run) 배포를 위해 필요한 GitHub Secrets 및 GCP Secret Manager 설정 가이드입니다.

## 환경변수 관리 방식

Frontend는 **GCP Secret Manager**를 사용하여 환경변수를 중앙 관리합니다 (Backend/Backoffice와 동일 패턴).

```
GCP Secret Manager (qjs-frontend-env)
  ↓ GitHub Actions에서 조회
  ↓ Docker build-args 주입
Cloud Run 배포
```

## 필수 GitHub Secrets

> **설정 위치**: GitHub Repository → Settings → Secrets and variables → Actions

### GCP 인증 (필수 2개만)

| Secret 이름 | 설명 | 확인 방법 |
|-------------|------|-----------|
| **GCP_PROJECT_ID** | GCP 프로젝트 ID | Backend 저장소의 `terraform` 디렉토리에서:<br>`terraform output -raw github_actions_sa_email \| cut -d'@' -f2 \| cut -d'.' -f1` |
| **GCP_SA_KEY** | Service Account JSON 키 | `terraform output -raw github_actions_sa_key \| base64 -d` |

> **중요**: 환경변수(`NEXT_PUBLIC_*`)는 GitHub Secrets가 아닌 GCP Secret Manager에서 관리합니다.

## GCP Secret Manager 설정

### Secret 이름: `qjs-frontend-env`

### 환경변수 목록

| 변수 | 설명 | 필수 여부 |
|------|------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | 필수 |
| `NEXT_PUBLIC_SITE_URL` | Frontend 사이트 URL | 필수 |
| `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` | Google Adsense 클라이언트 ID | 선택 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google 사이트 인증 | 선택 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 사이트 인증 | 선택 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 선택 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon 키 | 선택 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Toss Payments 클라이언트 키 | 선택 |

### 설정 방법

```bash
# 1. .env.prod 파일 생성
cat > .env.prod << 'ENVEOF'
# API 연결 (필수)
NEXT_PUBLIC_API_URL=https://api.alphafoundry.app
NEXT_PUBLIC_SITE_URL=https://alphafoundry.app

# SEO & Analytics (선택)
# NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=
# NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
# NEXT_PUBLIC_NAVER_SITE_VERIFICATION=

# Supabase (필요 시 활성화)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Toss Payments (필요 시 활성화)
# NEXT_PUBLIC_TOSS_CLIENT_KEY=
ENVEOF

# 2. Secret Manager에 업로드 (최초)
gcloud secrets create qjs-frontend-env --data-file=.env.prod

# 3. 업데이트 (이미 존재하는 경우)
gcloud secrets versions add qjs-frontend-env --data-file=.env.prod

# 4. 확인
gcloud secrets versions access latest --secret=qjs-frontend-env
```

## 현재 설정 상태

```bash
# GitHub Secrets 확인 (2개만 필요)
gh secret list

# 현재 설정된 Secrets:
# ✓ GCP_PROJECT_ID
# ✓ GCP_SA_KEY

# Secret Manager 확인
gcloud secrets list --filter="name:qjs-frontend"
# ✓ qjs-frontend-env
```

## 설정 방법

### GitHub Secrets 설정 (최초 1회)

```bash
# GitHub CLI로 설정
gh secret set GCP_PROJECT_ID -b "your-gcp-project-id"
gh secret set GCP_SA_KEY < gcp-sa-key.json

# 또는 GitHub 웹사이트에서 수동 설정
# Settings → Secrets and variables → Actions → New repository secret
```

### Secret Manager 권한 확인

Service Account(`qjs-github-actions`)에 Secret Manager 접근 권한이 있는지 확인:

```bash
gcloud projects get-iam-policy your-gcp-project-id \
  --flatten="bindings[].members" \
  --filter="bindings.members:qjs-github-actions@*"

# roles/secretmanager.secretAccessor 권한 필요
```

권한이 없다면 추가:

```bash
gcloud projects add-iam-policy-binding your-gcp-project-id \
  --member="serviceAccount:qjs-github-actions@your-gcp-project-id.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 배포 흐름

```
git push origin main
    ↓
GitHub Actions
    ↓
GCP 인증 (GCP_SA_KEY)
    ↓
Secret Manager 조회 (qjs-frontend-env)
    ↓
.env.prod 파일 생성
    ↓
환경변수 로드
    ↓
Docker 빌드 (build-args 주입)
    ↓
Artifact Registry Push
    ↓
Cloud Run 배포 (env_vars 주입)
```

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
```

**주의**: `.env.local`과 `.env.prod`는 `.gitignore`에 포함되어 커밋되지 않습니다.

## 문제 해결

### 배포 후 환경변수 미적용

```bash
# 1. Secret Manager 값 확인
gcloud secrets versions access latest --secret=qjs-frontend-env

# 2. GitHub Actions 로그 확인
# "Get secrets from Secret Manager" 단계에서 에러 확인

# 3. 재배포 (환경변수 변경 후)
gcloud secrets versions add qjs-frontend-env --data-file=.env.prod
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

### Secret Manager 접근 실패

```bash
# SA 권한 확인
gcloud projects get-iam-policy your-gcp-project-id \
  --flatten="bindings[].members" \
  --filter="bindings.members:qjs-github-actions@*"

# 권한 추가 (필요 시)
gcloud projects add-iam-policy-binding your-gcp-project-id \
  --member="serviceAccount:qjs-github-actions@your-gcp-project-id.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 보안 주의사항

- ⚠️ `NEXT_PUBLIC_*` 변수는 클라이언트에 노출되므로 민감 정보 포함 금지
- ⚠️ `.env.prod` 파일은 절대 Git에 커밋하지 마세요
- ⚠️ Service Account 키는 최소 권한만 부여하세요
- ⚠️ Secret Manager 값 변경 시 반드시 재배포 필요

## 관련 문서

- 전체 배포 가이드: `/docs/GCP_DEPLOYMENT.md`
- Backend 설정: `quant-jump-stock-backend/.github/SECRETS_SETUP.md`
- Backoffice 설정: `quant-jump-stock-backoffice/.github/SECRETS_SETUP.md`
