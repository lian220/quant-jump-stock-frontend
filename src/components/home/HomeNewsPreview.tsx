'use client';

import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NewsListResponse } from '@/lib/api/news';

interface Props {
  recentNewsData: NewsListResponse | undefined;
}

export function HomeNewsPreview({ recentNewsData }: Props) {
  if (!recentNewsData?.news || recentNewsData.news.length === 0) return null;

  return (
    <div className="mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-slate-400" />
          최신 투자 뉴스
        </h2>
        <Link href="/news">
          <Button variant="ghost" className="text-slate-400 hover:text-slate-200 text-sm h-8 px-2">
            더보기 →
          </Button>
        </Link>
      </div>
      <div className="space-y-2.5">
        {recentNewsData.news.map((article) => {
          let safeUrl = '/news';
          let isExternal = false;
          if (article.sourceUrl) {
            try {
              const parsed = new URL(article.sourceUrl);
              if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                safeUrl = article.sourceUrl;
                isExternal = true;
              }
            } catch {
              // invalid URL → fallback to /news
            }
          }
          return (
            <Link
              key={article.id ?? article.title}
              href={safeUrl}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
            >
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base text-slate-200 font-medium line-clamp-1">
                      {article.title}
                    </p>
                    {article.summary && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{article.summary}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 whitespace-nowrap shrink-0 mt-0.5">
                    {article.createdAt
                      ? new Date(article.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
