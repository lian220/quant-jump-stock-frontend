# Frontend 테스트 규칙 (서비스 특화)

> **공통 규칙은 SSOT인 [../docs/testing/테스트_규칙.md](../docs/testing/테스트_규칙.md)를 참조한다.**
> 이 문서는 Frontend 특화 사항만 기록한다.

## 실행 환경

- **개발 테스트**: `pnpm dev` (핫 리로드, 코드 수정 즉시 반영)
- **통합 테스트**: Docker 재빌드 (`./start.sh --build-frontend`)
- 통합 시작: 루트에서 `./start.sh --dev --build` (Backend Docker + Frontend 핫 리로드)
- **포트**: 3000

## E2E 테스트 대상 페이지

| 페이지    | 경로                        | 검증 항목                 |
| --------- | --------------------------- | ------------------------- |
| 홈        | `/`                         | 렌더링, 전략 목록 로드    |
| 로그인    | `/auth`                     | 폼 입력, 로그인 성공/실패 |
| 전략 목록 | `/strategies`               | 필터, 정렬, 페이지네이션  |
| 전략 상세 | `/strategies/[id]`          | 데이터 로드, 차트 렌더링  |
| 백테스트  | `/strategies/[id]/backtest` | 실행, 결과 표시           |
| 종목 목록 | `/stocks`                   | 검색, 필터                |
| 종목 상세 | `/stocks/[id]`              | 데이터 로드               |
| 결제      | `/payment`                  | 결제 흐름                 |

## 로그 확인

```bash
# 핫 리로드 모드 로그
tail -f .logs/frontend.log

# Docker 모드 로그
docker logs -f qjs-frontend
```
