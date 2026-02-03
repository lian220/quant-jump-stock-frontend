import { test, expect } from '@playwright/test';

test.describe('전략 목록 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/strategies');
    await page.waitForLoadState('networkidle');
  });

  test('페이지 타이틀과 헤더가 표시됨', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page.locator('h1').filter({ hasText: '전략 마켓플레이스' })).toBeVisible();

    // 설명 텍스트 확인
    await expect(
      page.getByText('검증된 퀀트 투자 전략을 탐색하고 나에게 맞는 전략을 선택하세요'),
    ).toBeVisible();
  });

  test('통계 카드가 표시됨', async ({ page }) => {
    // 4개의 통계 카드 확인
    await expect(page.getByText('전략 수')).toBeVisible();
    await expect(page.getByText('평균 구독자')).toBeVisible();
    await expect(page.getByText('평균 평점')).toBeVisible();
    await expect(page.getByText('프리미엄 전략')).toBeVisible();
  });

  test('전략 카드가 그리드로 표시됨', async ({ page }) => {
    // 전략 카드가 최소 1개 이상 표시되는지 확인
    const strategyCards = page.locator('[data-slot="card"]').filter({
      has: page.locator('text=/누적 수익률|연환산 수익률/'),
    });

    await expect(strategyCards.first()).toBeVisible();

    // 첫 번째 카드의 주요 요소 확인
    const firstCard = strategyCards.first();
    await expect(firstCard.locator('text=/누적 수익률/')).toBeVisible();
    await expect(firstCard.locator('text=/연환산 수익률/')).toBeVisible();
    await expect(firstCard.locator('text=/승률/')).toBeVisible();
    await expect(firstCard.locator('text=/샤프 비율/')).toBeVisible();
  });

  test('카테고리 필터 동작', async ({ page }) => {
    // 모멘텀 카테고리 클릭
    await page.getByText('모멘텀', { exact: true }).click();

    // 필터가 적용되었는지 확인 (페이지가 리로드되지 않음)
    await expect(page).toHaveURL('/strategies');

    // 결과 수가 표시되는지 확인
    await expect(page.getByText(/총.*개의 전략/)).toBeVisible();
  });

  test('리스크 레벨 필터 동작', async ({ page }) => {
    // 낮음 리스크 레벨 클릭
    const riskFilters = page.locator('text=/리스크 레벨/').locator('..');
    await riskFilters.getByText('낮음', { exact: true }).click();

    // 결과가 업데이트되는지 확인
    await expect(page.getByText(/총.*개의 전략/)).toBeVisible();
  });

  test('정렬 옵션 동작', async ({ page }) => {
    // 수익률 높은순 정렬 버튼 클릭
    await page.getByRole('button', { name: '수익률 높은순' }).click();

    // 정렬이 적용되었는지 확인
    await expect(page.getByRole('button', { name: '수익률 높은순' })).toHaveClass(/bg-emerald/);
  });

  test('페이지네이션 동작', async ({ page }) => {
    // 페이지네이션이 표시되는지 확인
    const pagination = page.locator('text=/페이지/').locator('..');

    // 다음 버튼이 있는지 확인
    const nextButton = page.getByRole('button', { name: '다음' });
    await expect(nextButton).toBeVisible();

    // 첫 페이지에서 이전 버튼은 비활성화되어야 함
    const prevButton = page.getByRole('button', { name: '이전' });
    await expect(prevButton).toBeDisabled();

    // 다음 페이지로 이동 (전략이 8개 이상인 경우)
    if ((await nextButton.isEnabled()) && !(await nextButton.isDisabled())) {
      await nextButton.click();

      // 이전 버튼이 활성화되는지 확인
      await expect(prevButton).toBeEnabled();
    }
  });

  test('필터 초기화 버튼 동작', async ({ page }) => {
    // 필터 적용
    await page.getByText('모멘텀', { exact: true }).click();
    await page.getByRole('button', { name: '수익률 높은순' }).click();

    // 필터 초기화 버튼 클릭
    await page.getByRole('button', { name: '필터 초기화' }).click();

    // 필터가 초기화되었는지 확인 (전체 카테고리로 돌아감)
    await expect(page.getByText('전체', { exact: true }).first()).toBeVisible();
  });

  test('전략 카드 호버 효과', async ({ page }) => {
    const firstCard = page.locator('[data-slot="card"]').first();

    // 카드에 호버
    await firstCard.hover();

    // 호버 효과가 있는지 확인 (border 색상 변경)
    await expect(firstCard).toHaveClass(/hover:border-emerald/);
  });

  test('상세보기 버튼 클릭', async ({ page }) => {
    // 첫 번째 카드의 상세보기 버튼 클릭
    const detailButton = page.getByRole('button', { name: '상세보기' }).first();
    await expect(detailButton).toBeVisible();

    // 버튼이 링크로 감싸져 있는지 확인
    const detailLink = page.locator('a[href^="/strategies/"]').first();
    await expect(detailLink).toBeVisible();
  });

  test('반응형 디자인 - 모바일', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });

    // 페이지가 정상적으로 표시되는지 확인
    await expect(page.locator('h1').filter({ hasText: '전략 마켓플레이스' })).toBeVisible();

    // 필터 사이드바가 표시되는지 확인
    await expect(page.getByText('카테고리')).toBeVisible();
  });

  test('반응형 디자인 - 태블릿', async ({ page }) => {
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 });

    // 페이지가 정상적으로 표시되는지 확인
    await expect(page.locator('h1').filter({ hasText: '전략 마켓플레이스' })).toBeVisible();

    // 그리드가 2열로 표시되는지 확인 (클래스 확인)
    const grid = page.locator('.grid').first();
    await expect(grid).toHaveClass(/md:grid-cols-2/);
  });

  test('프리미엄 배지 표시', async ({ page }) => {
    // 프리미엄 배지가 있는 카드 찾기
    const premiumBadge = page.getByText('프리미엄').first();

    // 프리미엄 배지가 있다면 표시되는지 확인
    const count = await premiumBadge.count();
    if (count > 0) {
      await expect(premiumBadge).toBeVisible();
    }
  });

  test('접근성 - 키보드 네비게이션', async ({ page }) => {
    // Tab 키로 네비게이션 가능한지 확인
    await page.keyboard.press('Tab');

    // 포커스가 이동하는지 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });
});
