'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BacktestTradeResponse, ExitReason } from '@/types/backtest';

// UX-07: 청산 사유 한글 매핑
const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  SIGNAL: '시그널',
  STOP_LOSS: '손절',
  TAKE_PROFIT: '익절',
  TRAILING_STOP: '트레일링',
  REBALANCE: '리밸런싱',
  FORCED: '강제 청산',
  EXPIRED: '만기',
};

const EXIT_REASON_COLORS: Record<ExitReason, string> = {
  SIGNAL: 'text-slate-300',
  STOP_LOSS: 'text-red-400',
  TAKE_PROFIT: 'text-emerald-400',
  TRAILING_STOP: 'text-amber-400',
  REBALANCE: 'text-cyan-400',
  FORCED: 'text-red-500',
  EXPIRED: 'text-slate-400',
};

interface TradeHistoryTableProps {
  trades: BacktestTradeResponse[];
}

const PAGE_SIZE = 10;

type SortKey = 'date' | 'pnl' | 'ticker';
type SortDir = 'asc' | 'desc';
type SideFilter = 'ALL' | 'BUY' | 'SELL';

export default function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const safeTrades = useMemo(() => trades ?? [], [trades]);
  const [currentPage, setCurrentPage] = useState(1);
  // FIN-07: 정렬/필터
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [sideFilter, setSideFilter] = useState<SideFilter>('ALL');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'pnl' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  // 필터 + 정렬 적용
  const processedTrades = useMemo(() => {
    let filtered = safeTrades;
    if (sideFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.side === sideFilter);
    }
    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'date') return (a.tradeDate > b.tradeDate ? 1 : -1) * dir;
      if (sortKey === 'pnl') return ((a.pnl ?? 0) - (b.pnl ?? 0)) * dir;
      if (sortKey === 'ticker') return a.ticker.localeCompare(b.ticker) * dir;
      return 0;
    });
  }, [safeTrades, sideFilter, sortKey, sortDir]);

  // trades가 변경되면 페이지 리셋
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(processedTrades.length / PAGE_SIZE));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [processedTrades, currentPage]);

  const totalPages = Math.ceil(processedTrades.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedTrades = processedTrades.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">거래 내역</CardTitle>
        <div className="flex items-center justify-between">
          <CardDescription className="text-slate-400">
            총 {safeTrades.length}건의 거래 내역
            {sideFilter !== 'ALL' && ` (필터: ${processedTrades.length}건)`}
          </CardDescription>
          {/* FIN-07: 매수/매도 필터 */}
          <div className="flex gap-1 bg-slate-700/50 rounded-lg p-0.5">
            {(['ALL', 'BUY', 'SELL'] as SideFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setSideFilter(f);
                  setCurrentPage(1);
                }}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  sideFilter === f
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {f === 'ALL' ? '전체' : f === 'BUY' ? '매수' : '매도'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th
                  className="text-left text-slate-400 py-2 px-3 cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => handleSort('date')}
                >
                  날짜{sortIndicator('date')}
                </th>
                <th
                  className="text-left text-slate-400 py-2 px-3 cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => handleSort('ticker')}
                >
                  종목{sortIndicator('ticker')}
                </th>
                <th className="text-center text-slate-400 py-2 px-3">매매</th>
                <th className="text-right text-slate-400 py-2 px-3">수량</th>
                <th className="text-right text-slate-400 py-2 px-3">가격</th>
                <th className="text-right text-slate-400 py-2 px-3">금액</th>
                <th
                  className="text-right text-slate-400 py-2 px-3 cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => handleSort('pnl')}
                >
                  손익{sortIndicator('pnl')}
                </th>
                <th className="text-right text-slate-400 py-2 px-3">손익률</th>
                <th className="text-center text-slate-400 py-2 px-3">청산 사유</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade, idx) => (
                <tr
                  key={`${trade.tradeDate}-${trade.ticker}-${idx}`}
                  className="border-t border-slate-700"
                >
                  <td className="text-slate-300 py-2 px-3">{trade.tradeDate}</td>
                  <td className="text-white py-2 px-3 font-medium">{trade.ticker}</td>
                  <td className="text-center py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        trade.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {trade.side === 'BUY' ? '매수' : '매도'}
                    </span>
                  </td>
                  <td className="text-slate-300 text-right py-2 px-3">
                    {trade.quantity != null ? trade.quantity.toLocaleString() : '-'}
                  </td>
                  <td className="text-slate-300 text-right py-2 px-3">
                    {trade.price != null ? `${trade.price.toLocaleString()}원` : '-'}
                  </td>
                  <td className="text-slate-300 text-right py-2 px-3">
                    {trade.amount != null ? `${trade.amount.toLocaleString()}원` : '-'}
                  </td>
                  <td
                    className={`text-right py-2 px-3 font-medium ${
                      (trade.pnl ?? 0) > 0
                        ? 'text-emerald-400'
                        : (trade.pnl ?? 0) < 0
                          ? 'text-red-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {trade.pnl != null && trade.pnl !== 0
                      ? `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toLocaleString()}원`
                      : '-'}
                  </td>
                  <td
                    className={`text-right py-2 px-3 font-medium ${
                      (trade.pnlPercent ?? 0) > 0
                        ? 'text-emerald-400'
                        : (trade.pnlPercent ?? 0) < 0
                          ? 'text-red-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {trade.pnlPercent != null && trade.pnlPercent !== 0
                      ? `${trade.pnlPercent > 0 ? '+' : ''}${trade.pnlPercent.toFixed(1)}%`
                      : '-'}
                  </td>
                  {/* UX-07: 청산 사유 */}
                  <td className="text-center py-2 px-3">
                    {trade.exitReason ? (
                      <span
                        className={`text-xs font-medium ${EXIT_REASON_COLORS[trade.exitReason]}`}
                      >
                        {EXIT_REASON_LABELS[trade.exitReason]}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // 현재 페이지 주변 2페이지 + 처음/끝 표시
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="text-slate-500 px-1">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      }
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              다음
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
