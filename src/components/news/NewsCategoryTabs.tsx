'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { CategoryGroup } from '@/lib/api/news';

const ICON_MAP: Record<string, string> = {
  zap: '⚡',
  'bar-chart-2': '📊',
  landmark: '🏛️',
  'trending-up': '📈',
  search: '🔍',
  shield: '🛡️',
  'git-merge': '🤝',
  layers: '📋',
  gift: '🎁',
  flame: '🔥',
  bitcoin: '₿',
  'pie-chart': '🥧',
  globe: '🌍',
  target: '🎯',
  calendar: '📅',
};

interface Props {
  categoryGroups: CategoryGroup[];
  subscribedCategories: Set<string>;
  selectedCategory: string | null;
  subscribingCategory: string | null;
  filterMode: string;
  isLoggedIn: boolean;
  onCategoryClick: (categoryName: string) => void;
  onSubscribeToggle: (categoryName: string, e: React.MouseEvent) => void;
  onReset: () => void;
}

export function NewsCategoryTabs({
  categoryGroups,
  subscribedCategories,
  selectedCategory,
  subscribingCategory,
  filterMode,
  isLoggedIn,
  onCategoryClick,
  onSubscribeToggle,
  onReset,
}: Props) {
  if (categoryGroups.length === 0) return null;

  return (
    <div className="mb-4 md:mb-6">
      {/* 데스크톱: 그룹별 가로 배치 */}
      <div className="hidden md:block space-y-3">
        {categoryGroups.map((group) => (
          <div key={group.group} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-12 shrink-0 text-right">
              {group.groupLabel}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.categories.map((cat) => {
                const isSubscribed = subscribedCategories.has(cat.name);
                const isSubscribing = subscribingCategory === cat.name;

                return (
                  <div key={cat.id} className="group relative inline-flex items-center">
                    <button
                      onClick={() => onCategoryClick(cat.name)}
                      title={cat.description ?? cat.nameEn}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-l-full text-xs font-medium transition-all ${
                        selectedCategory === cat.name
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-700/60 hover:text-slate-300'
                      } ${isLoggedIn ? 'rounded-l-full border-r-0' : 'rounded-full'}`}
                    >
                      {cat.icon && <span className="text-[11px]">{ICON_MAP[cat.icon] || ''}</span>}
                      {cat.name}
                    </button>
                    {isLoggedIn && (
                      <button
                        onClick={(e) => onSubscribeToggle(cat.name, e)}
                        disabled={isSubscribing}
                        title={isSubscribed ? '알림 해제' : '알림 받기'}
                        className={`inline-flex items-center px-1.5 py-1 rounded-r-full text-[10px] transition-all border ${
                          isSubscribed
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                            : selectedCategory === cat.name
                              ? 'bg-cyan-500/10 text-slate-500 border-cyan-500/40 hover:text-cyan-400'
                              : 'bg-slate-800/60 text-slate-600 border-slate-700 hover:text-cyan-400 hover:border-cyan-500/40'
                        } ${isSubscribing ? 'opacity-50' : ''}`}
                      >
                        {isSubscribing ? '...' : isSubscribed ? '🔔' : '🔕'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 모바일: 단일 스크롤 */}
      <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-1.5 w-max">
          <button
            onClick={onReset}
            className={`shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              !selectedCategory && filterMode === 'recent'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700'
            }`}
          >
            전체
          </button>
          {categoryGroups.flatMap((g) =>
            g.categories.map((cat) => {
              const isSubscribed = subscribedCategories.has(cat.name);
              return (
                <div key={cat.id} className="shrink-0 inline-flex items-center">
                  <button
                    onClick={() => onCategoryClick(cat.name)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all ${
                      selectedCategory === cat.name
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                    } ${isLoggedIn ? 'rounded-l-full border-r-0' : 'rounded-full'}`}
                  >
                    {cat.icon && <span className="text-[11px]">{ICON_MAP[cat.icon] || ''}</span>}
                    {cat.name}
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={(e) => onSubscribeToggle(cat.name, e)}
                      className={`px-1 py-1.5 rounded-r-full text-[10px] border transition-all ${
                        isSubscribed
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                          : 'bg-slate-800/60 text-slate-600 border-slate-700'
                      }`}
                    >
                      {isSubscribed ? '🔔' : '🔕'}
                    </button>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* 구독 안내 (비로그인) */}
      {!isLoggedIn && (
        <p className="text-center text-xs text-slate-500 mt-2">
          <Link href="/auth?returnUrl=/news" className="text-cyan-400 hover:underline">
            로그인
          </Link>
          하면 카테고리별 알림을 받을 수 있습니다
        </p>
      )}

      {/* 구독 현황 */}
      {isLoggedIn && subscribedCategories.size > 0 && (
        <div className="mt-2 flex items-center gap-2 justify-center flex-wrap">
          <span className="text-xs text-slate-500">구독 중:</span>
          {Array.from(subscribedCategories).map((name) => (
            <Badge
              key={name}
              className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            >
              🔔 {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
