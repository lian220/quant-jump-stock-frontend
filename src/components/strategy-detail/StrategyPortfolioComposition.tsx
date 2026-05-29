'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DefaultStockResponse } from '@/types/api';

interface Props {
  defaultStocks: DefaultStockResponse[];
  totalWeight: number;
}

export function StrategyPortfolioComposition({ defaultStocks, totalWeight }: Props) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 mb-8">
      <CardHeader>
        <CardTitle className="text-white">포트폴리오 구성</CardTitle>
        <CardDescription className="text-slate-400">
          이 전략의 기본 포트폴리오 종목과 비중입니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 py-3 px-3">종목명</th>
                <th className="text-left text-slate-400 py-3 px-2">티커</th>
                <th className="text-left text-slate-400 py-3 px-2">시장</th>
                <th className="text-right text-slate-400 py-3 px-3">비중</th>
              </tr>
            </thead>
            <tbody>
              {defaultStocks.map((stock) => (
                <tr key={stock.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                  <td className="text-white py-2.5 px-3 font-medium">
                    {stock.stockName}
                    {stock.stockNameEn && (
                      <span className="ml-1 text-xs text-slate-500">({stock.stockNameEn})</span>
                    )}
                  </td>
                  <td className="text-slate-300 py-2.5 px-2 font-mono text-xs">{stock.ticker}</td>
                  <td className="py-2.5 px-2">
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                      {stock.market}
                    </Badge>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-slate-700/50 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min(stock.targetWeight, 100)}%` }}
                        />
                      </div>
                      <span className="text-emerald-400 font-semibold min-w-[3rem] text-right">
                        {stock.targetWeight}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-600">
                <td colSpan={3} className="text-white font-semibold py-2.5 px-3">
                  합계
                </td>
                <td className="text-right py-2.5 px-3">
                  <span
                    className={`font-bold ${Math.abs(totalWeight - 100) < 0.01 ? 'text-emerald-400' : 'text-orange-400'}`}
                  >
                    {totalWeight}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
