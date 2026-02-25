import { SeoConfigProps } from '@/types/seo';

// 사이트 기본 SEO 설정
export const seoConfig: SeoConfigProps = {
  defaultTitle: 'Alpha Foundry - AI 기반 스마트 투자 플랫폼',
  titleTemplate: '%s | Alpha Foundry',
  defaultDescription:
    'AI가 매일 종목을 분석하고, 검증된 투자 전략을 제공합니다. 주식 초보도 쉽게 시작할 수 있는 데이터 기반 투자 플랫폼.',
  defaultKeywords:
    'AI주식분석, 주식투자, AI투자, 주식초보, 종목추천, 주식분석, 투자전략, 모멘텀투자, 주식데이터',
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
    title: 'AI 기반 주식 분석 플랫폼',
    description:
      'AI가 매일 종목을 분석해드려요. 초보자도 쉽게 이해할 수 있는 점수와 추천으로 데이터 기반 투자를 시작하세요.',
    keywords: 'AI주식분석, 주식초보, 종목추천, 투자전략, AI투자',
  },
  auth: {
    title: '로그인 / 회원가입',
    description: 'Alpha Foundry에 가입하고 AI 기반 투자 분석 서비스를 무료로 시작하세요',
    keywords: 'Alpha Foundry 로그인, 회원가입, 주식투자 시작',
  },
  payment: {
    title: '프리미엄 플랜',
    description: '프리미엄 구독으로 더 정확한 AI 분석과 투자 전략을 받아보세요',
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
