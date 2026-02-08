/**
 * Open Graph 이미지 생성 스크립트
 * 1200x630 크기의 소셜 미디어 최적화 이미지를 생성합니다.
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generateOGImage() {
  // 캔버스 생성 (1200x630)
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 그라디언트 배경
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f172a'); // slate-900
  gradient.addColorStop(1, '#1e293b'); // slate-800
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 로고 이미지 로드 시도
  try {
    const logoPath = path.join(__dirname, '../public/main_logo.png');
    const logo = await loadImage(logoPath);

    // 로고 크기 조정 (최대 200x200)
    const logoSize = 180;
    const logoX = (width - logoSize) / 2;
    const logoY = 120;
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  } catch (error) {
    console.log('로고 이미지를 찾을 수 없습니다. 텍스트만 사용합니다.');
  }

  // 제목 텍스트
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Alpha Foundry', width / 2, 380);

  // 부제목
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText('AI 기반 스마트 투자 플랫폼', width / 2, 440);

  // 설명 텍스트
  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px Arial, sans-serif';
  ctx.fillText('AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요', width / 2, 500);

  // 아이콘과 키워드
  ctx.font = '20px Arial, sans-serif';
  const features = ['📊 실시간 시세', '🤖 AI 퀀트 전략', '📈 백테스팅'];
  const featureY = 560;
  const featureSpacing = 280;
  const startX = (width - featureSpacing * (features.length - 1)) / 2;

  features.forEach((feature, i) => {
    const x = startX + i * featureSpacing;
    ctx.fillText(feature, x, featureY);
  });

  // PNG로 저장
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, '../public/og-image.png');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ OG 이미지 생성 완료: public/og-image.png');
  console.log(`   크기: ${width}x${height}px`);
}

// 실행
generateOGImage().catch((err) => {
  console.error('❌ OG 이미지 생성 실패:', err.message);
  console.log('');
  console.log('📦 canvas 패키지 설치 필요:');
  console.log('   pnpm add -D canvas');
  process.exit(1);
});
