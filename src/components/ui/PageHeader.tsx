import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, actions, className }: Props) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', className)}>
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
