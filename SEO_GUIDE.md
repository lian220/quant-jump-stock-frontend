# 🔍 SEO 및 소셜 미디어 공유 가이드

## ✅ 완료된 설정

### 1. Open Graph 메타 태그

**파일**: `src/app/layout.tsx`

카카오톡, 페이스북, 링크드인 등 모든 소셜 미디어에서 정상 작동:

- 제목: "Alpha Foundry - AI 기반 스마트 투자 플랫폼"
- 설명: "AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요..."
- 이미지: `/main_logo.png` (512x512)
- 로케일: 한국어 (ko_KR)

### 2. Twitter Cards

Twitter/X 공유 최적화 완료

### 3. 브랜딩 통일

- "Quant Jump" → "Alpha Foundry"
- `quantjump.co.kr` → `alphafoundry.co.kr`

---

## 🧪 테스트 방법

### 로컬 테스트

```bash
# 개발 서버 실행
pnpm dev

# 메타 태그 확인
curl http://localhost:3000 | grep "og:"

# 로고 이미지 확인
open http://localhost:3000/main_logo.png
```

### 배포 후 검증

**온라인 검증 도구**:

1. [카카오 디버거](https://developers.kakao.com/tool/debugger/sharing) - URL 입력 후 "미리보기"
2. [Facebook 디버거](https://developers.facebook.com/tools/debug/) - "새 스크래핑 정보 가져오기"
3. [OpenGraph.xyz](https://www.opengraph.xyz/) - 통합 미리보기

**실제 공유 테스트**:

- 카카오톡 채팅방에 URL 입력 → 로고/제목/설명 표시 확인 ✅

---

## 🚀 배포 체크리스트

### Vercel 배포 전

```bash
# 1. 환경 변수 확인
echo "NEXT_PUBLIC_SITE_URL=https://alphafoundry.co.kr" >> .env.local

# 2. 빌드 테스트
pnpm build
```

### Vercel 배포 후

1. **환경 변수 설정**
   - Dashboard → Settings → Environment Variables
   - `NEXT_PUBLIC_SITE_URL=https://alphafoundry.co.kr` 추가

2. **검증**

   ```bash
   # 메타 태그 확인
   curl https://alphafoundry.co.kr | grep "og:image"

   # 이미지 접근 확인
   curl -I https://alphafoundry.co.kr/main_logo.png
   ```

3. **소셜 미디어 테스트**
   - 카카오 디버거에서 URL 검증
   - 실제 카카오톡에서 URL 공유

---

## ⚠️ 캐시 문제 해결

이전에 URL을 공유한 적이 있다면 캐시 초기화 필요:

- **카카오톡**: 디버거에서 "캐시 초기화" 클릭
- **Facebook**: "새 스크래핑 정보 가져오기" 클릭
- **Twitter**: 자동 업데이트 (최대 24시간 소요)

---

## 📱 예상 미리보기

### 카카오톡 공유 시

```
┌─────────────────────────────────┐
│  [Alpha Foundry 로고]           │
│  Alpha Foundry                  │
│  AI 기반 스마트 투자 플랫폼      │
│  AI와 빅데이터 분석으로...       │
│  alphafoundry.co.kr             │
└─────────────────────────────────┘
```

---

## 📋 설정된 메타 태그

```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://alphafoundry.co.kr" />
<meta property="og:title" content="Alpha Foundry - AI 기반 스마트 투자 플랫폼" />
<meta property="og:description" content="AI와 빅데이터 분석으로..." />
<meta property="og:image" content="https://alphafoundry.co.kr/main_logo.png" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
<meta property="og:locale" content="ko_KR" />
<meta property="og:site_name" content="Alpha Foundry" />
```

---

## 📚 참고 자료

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [카카오톡 공유 가이드](https://developers.kakao.com/docs/latest/ko/message/common)
