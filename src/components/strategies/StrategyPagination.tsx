'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { PaginationInfo } from '@/types/strategy';

interface StrategyPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function StrategyPagination({ pagination, onPageChange }: StrategyPaginationProps) {
  const { currentPage, totalPages } = pagination;

  // 페이지 번호 배열 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 총 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 총 페이지가 5개 초과
      if (currentPage <= 3) {
        // 현재 페이지가 앞쪽
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 현재 페이지가 뒤쪽
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 현재 페이지가 중간
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 이전 페이지 */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
        className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        이전
      </Button>

      {/* 페이지 번호 */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-500">
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === currentPage;

        return (
          <Button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={
              isActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white min-w-[40px]'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700 min-w-[40px]'
            }
          >
            {pageNumber}
          </Button>
        );
      })}

      {/* 다음 페이지 */}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
        className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        다음
      </Button>
    </div>
  );
}
