'use client';

import { Badge } from '@/components/ui/badge';
import { getImportanceInfo, getSourceLabel } from '@/lib/api/news';
import type { NewsArticle } from '@/lib/api/news';
import { formatRelativeTime } from '@/lib/utils';

interface Props {
  article: NewsArticle;
  isLoggedIn: boolean;
  subscribedTickers: Set<string>;
  onClose: () => void;
  onTickerClick: (ticker: string) => void;
  onTagClick: (tag: string) => void;
  onAddTicker: (ticker: string) => void;
}

export function NewsArticleModal({
  article,
  isLoggedIn,
  subscribedTickers,
  onClose,
  onTickerClick,
  onTagClick,
  onAddTicker,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="기사 상세"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <h2 className="text-lg md:text-xl font-bold text-white leading-snug">{article.title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 py-4 space-y-4">
          {/* 메타 정보 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${getImportanceInfo(article.importanceScore).badgeClass}`}>
              {getImportanceInfo(article.importanceScore).label}
            </Badge>
            <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs">
              {article.originalSource || getSourceLabel(article.source)}
            </Badge>
            <span className="text-xs text-slate-500">{formatRelativeTime(article.createdAt)}</span>
          </div>

          {/* 본문 / 요약 */}
          {article.content || article.summary ? (
            <div className="space-y-2">
              <p className="text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                {article.content || article.summary}
              </p>
              {article.content && article.summary && (
                <p className="text-xs text-slate-500 italic">{'요약: ' + article.summary}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              상세 내용이 없습니다. 원문에서 확인하세요.
            </p>
          )}

          {/* 관련 티커 */}
          {article.tickers.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">관련 종목</p>
              <div className="flex flex-wrap gap-1.5">
                {article.tickers.map((ticker) => (
                  <div key={ticker} className="inline-flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        onClose();
                        onTickerClick(ticker);
                      }}
                      className="text-xs px-2 py-1 rounded-l bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    >
                      ${ticker}
                    </button>
                    {isLoggedIn && !subscribedTickers.has(ticker) && (
                      <button
                        onClick={() => onAddTicker(ticker)}
                        className="text-xs px-1.5 py-1 rounded-r bg-cyan-500/10 text-cyan-400 border border-l-0 border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                        title="관심 종목 추가"
                      >
                        +
                      </button>
                    )}
                    {isLoggedIn && subscribedTickers.has(ticker) && (
                      <span className="text-xs px-1.5 py-1 rounded-r bg-emerald-500/10 text-emerald-500/60 border border-l-0 border-emerald-500/20">
                        ⭐
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 관련 태그 */}
          {article.tags.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      onClose();
                      onTagClick(tag);
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 원문 보기 버튼 */}
          {article.sourceUrl && (
            <div className="pt-2">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
              >
                원문 보기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
