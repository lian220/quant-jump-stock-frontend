'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTerm } from '@/lib/investment-terms';

interface TermTooltipProps {
  termKey: string;
  children?: React.ReactNode;
}

export function TermTooltip({ termKey, children }: TermTooltipProps) {
  const term = getTerm(termKey);
  if (!term) return children ?? null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-3 w-3 text-slate-500 hover:text-slate-300 transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-slate-800 text-slate-200 border border-slate-600 px-3 py-2 text-xs leading-relaxed"
        >
          <p className="font-medium text-slate-100 mb-1">{term.label}</p>
          <p>{term.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
