/**
 * 종목 검색/목록 API
 * 사용자용 종목 조회 클라이언트
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

// === 타입 정의 ===

export type Market = 'US' | 'KR' | 'CRYPTO';
export type DesignationStatus = 'NORMAL' | 'CAUTION' | 'WARNING' | 'DANGER' | 'DELISTED';

export interface StockSummary {
  id: number;
  ticker: string;
  stockName: string;
  stockNameEn: string | null;
  market: Market;
  sector: string | null;
  isEtf: boolean;
  designationStatus: DesignationStatus;
  isActive: boolean;
  currentPrice: number | null;
  changePercent: number | null;
  changeAmount: number | null;
  volume: number | null;
  priceDate: string | null;
}

export interface StockDetailResponse {
  id: number;
  ticker: string;
  stockName: string;
  stockNameEn: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  market: Market;
  isEtf: boolean;
  leverageTicker: string | null;
  designationStatus: DesignationStatus;
  designationReason: string | null;
  designatedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentPrice: number | null;
  previousClose: number | null;
  changeAmount: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  priceDate: string | null;
}

export interface StockSearchResponse {
  stocks: StockSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface SearchStocksParams {
  query?: string;
  market?: Market;
  sector?: string;
  page?: number;
  size?: number;
}

// === API 함수 ===

export async function searchStocks(params: SearchStocksParams = {}): Promise<StockSearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.append('query', params.query);
  if (params.market) searchParams.append('market', params.market);
  if (params.sector) searchParams.append('sector', params.sector);
  searchParams.append('page', String(params.page ?? 0));
  searchParams.append('size', String(params.size ?? 20));
  searchParams.append('isActive', 'true');

  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `/api/stocks` : `${API_URL}/api/v1/stocks`;
  const url = `${baseUrl}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`종목 검색 실패: ${response.status}`);
  }

  return response.json();
}

export async function getStockDetail(id: number): Promise<StockDetailResponse> {
  const isBrowser = typeof window !== 'undefined';
  const url = isBrowser ? `/api/stocks/${id}` : `${API_URL}/api/v1/stocks/${id}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`종목 조회 실패: ${response.status}`);
  }

  return response.json();
}

// === 유틸리티 상수 ===

export const marketLabels: Record<Market, string> = {
  US: '미국',
  KR: '한국',
  CRYPTO: '암호화폐',
};

export const designationLabels: Record<DesignationStatus, string> = {
  NORMAL: '정상',
  CAUTION: '주의',
  WARNING: '경고',
  DANGER: '위험',
  DELISTED: '상장폐지',
};
