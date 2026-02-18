'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type CtaAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
};

interface StateMessageCardProps {
  title: string;
  description: string;
  icon?: string;
  tone?: 'default' | 'error';
  primaryAction?: CtaAction;
  secondaryAction?: CtaAction;
}

function ActionButton({ action }: { action: CtaAction }) {
  if (action.href) {
    return (
      <Button asChild variant={action.variant ?? 'outline'}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button variant={action.variant ?? 'outline'} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function StateMessageCard({
  title,
  description,
  icon,
  tone = 'default',
  primaryAction,
  secondaryAction,
}: StateMessageCardProps) {
  const titleColor = tone === 'error' ? 'text-red-400' : 'text-slate-200';

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="py-12 text-center">
        {icon && <p className="text-3xl mb-3">{icon}</p>}
        <p className={`text-lg mb-2 ${titleColor}`}>{title}</p>
        <p className="text-sm text-slate-500">{description}</p>

        {(primaryAction || secondaryAction) && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
            {primaryAction && <ActionButton action={primaryAction} />}
            {secondaryAction && <ActionButton action={secondaryAction} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
