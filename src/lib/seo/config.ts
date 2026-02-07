import { SeoConfigProps } from '@/types/seo';

// 사이트 기본 SEO 설정
export const seoConfig: SeoConfigProps = {
  defaultTitle: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
  titleTemplate: '%s | Alpha Foundry',
  defaultDescription:
    'AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요. 실시간 시세, 퀀트 전략, 백테스팅까지 데이터 기반 체계적인 주식 투자 플랫폼.',
  defaultKeywords:
    '퀀트투자, 주식투자, AI투자, 알고리즘트레이딩, 백테스팅, 실시간시세, 주식분석, 퀀트전략, 모멘텀투자, 자동매매',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://alphafoundry.co.kr',
  siteName: 'Alpha Foundry',
  defaultImage: '/logo.png',
  twitterUsername: '@alphafoundry',
  language: 'ko',
  locale: 'ko_KR',
};

// 페이지별 기본 SEO 설정들
export const pageDefaults = {
  home: {
    title: 'AI 기반 퀀트 투자 플랫폼',
    description:
      'AI와 빅데이터로 스마트한 주식 투자. 실시간 시세, 퀀트 분석, 백테스팅으로 데이터 기반 투자를 시작하세요.',
    keywords: '퀀트투자, AI주식분석, 실시간시세, 백테스팅, 알고리즘트레이딩',
  },
  auth: {
    title: '로그인 / 회원가입',
    description: 'Alpha Foundry에 가입하고 AI 기반 투자 분석 서비스를 무료로 시작하세요',
    keywords: 'Alpha Foundry 로그인, 회원가입, 주식투자 시작',
  },
  payment: {
    title: '프리미엄 플랜',
    description: '프리미엄 구독으로 고급 퀀트 전략과 실시간 매매 신호를 받아보세요',
    keywords: 'Alpha Foundry 프리미엄, 유료 구독, 투자 신호, VIP 서비스',
  },
} as const;

// Open Graph 기본 이미지 설정
export const defaultOpenGraphImages = {
  home: '/images/og/home.jpg',
  auth: '/images/og/auth.jpg',
  payment: '/images/og/payment.jpg',
  default: '/images/og/default.jpg',
};

// 구조화된 데이터 템플릿들
export const structuredDataTemplates = {
  // 조직 정보
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo.png`,
    description: seoConfig.defaultDescription,
    sameAs: ['https://github.com/alphafoundry', 'https://twitter.com/alphafoundry'],
  },

  // 웹사이트 정보
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
    inLanguage: seoConfig.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },

  // 소프트웨어 애플리케이션 정보
  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: seoConfig.siteName,
    description: seoConfig.defaultDescription,
    url: seoConfig.siteUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    author: {
      '@type': 'Organization',
      name: 'Alpha Foundry',
    },
  },
};
