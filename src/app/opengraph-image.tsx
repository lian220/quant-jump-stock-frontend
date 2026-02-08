import { ImageResponse } from 'next/og';

// 이미지 메타데이터
export const alt = 'Alpha Foundry - AI 기반 스마트 투자 플랫폼';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// OG 이미지 생성 (카카오톡, 페이스북, 트위터 등)
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* 로고 영역 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        {/* 로고 이미지는 public/main_logo.png 사용 */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.05em',
          }}
        >
          Alpha Foundry
        </div>
      </div>

      {/* 설명 텍스트 */}
      <div
        style={{
          fontSize: 36,
          color: '#e2e8f0',
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.4,
        }}
      >
        AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요
      </div>

      {/* 부가 정보 */}
      <div
        style={{
          display: 'flex',
          gap: 30,
          marginTop: 50,
          fontSize: 24,
          color: '#94a3b8',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>📊</span>
          <span>실시간 시세</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>🤖</span>
          <span>AI 퀀트 전략</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>📈</span>
          <span>백테스팅</span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
