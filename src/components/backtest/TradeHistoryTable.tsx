'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BacktestTradeResponse } from '@/types/backtest';

interface TradeHistoryTableProps {
  trades: BacktestTradeResponse[];
}

const PAGE_SIZE = 10;

export default function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const safeTrades = useMemo(() => trades ?? [], [trades]);
  const [currentPage, setCurrentPage] = useState(1);

  // trades가 변경되면 페이지 리셋
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(safeTrades.length / PAGE_SIZE));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [safeTrades, currentPage]);

  const totalPages = Math.ceil(safeTrades.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedTrades = safeTrades.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">거래 내역</CardTitle>
        <CardDescription className="text-slate-400">
          총 {safeTrades.length}건의 거래 내역
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-slate-400 py-2 px-3">날짜</th>
                <th className="text-left text-slate-400 py-2 px-3">종목</th>
                <th className="text-center text-slate-400 py-2 px-3">매매</th>
                <th className="text-right text-slate-400 py-2 px-3">수량</th>
                <th className="text-right text-slate-400 py-2 px-3">가격</th>
                <th className="text-right text-slate-400 py-2 px-3">금액</th>
                <th className="text-right text-slate-400 py-2 px-3">손익</th>
                <th className="text-right text-slate-400 py-2 px-3">손익률</th>
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
