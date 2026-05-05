import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import Sparkline from '@/components/ui/Sparkline';

type Tone = 'emerald' | 'indigo' | 'amber' | 'rose' | 'primary';

interface Props {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'inr';
  icon: LucideIcon;
  tone?: Tone;
  deltaPct?: number;
  series?: number[];
}

const TONES: Record<Tone, { grad: string; ring: string; icon: string; spark: string }> = {
  emerald: { grad: 'from-emerald-500/15 via-emerald-500/5', ring: 'border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', spark: 'text-emerald-500' },
  indigo:  { grad: 'from-indigo-500/15 via-indigo-500/5',   ring: 'border-indigo-500/20',  icon: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',   spark: 'text-indigo-500' },
  amber:   { grad: 'from-amber-500/15 via-amber-500/5',     ring: 'border-amber-500/20',   icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',     spark: 'text-amber-500' },
  rose:    { grad: 'from-rose-500/15 via-rose-500/5',       ring: 'border-rose-500/20',    icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',         spark: 'text-rose-500' },
  primary: { grad: 'from-primary/15 via-primary/5',         ring: 'border-primary/20',     icon: 'bg-primary/15 text-primary',                              spark: 'text-primary' },
};

const StatCard = ({ label, value, prefix = '', suffix = '', format = 'number', icon: Icon, tone = 'primary', deltaPct, series }: Props) => {
  const animated = useCountUp(value);
  const t = TONES[tone];
  const display = format === 'inr'
    ? Math.round(animated).toLocaleString('en-IN')
    : Math.round(animated).toLocaleString('en-IN');

  const positive = (deltaPct ?? 0) >= 0;

  return (
    <Card className={cn('relative overflow-hidden p-4 border bg-gradient-to-br to-background transition-all hover:-translate-y-0.5 hover:shadow-md', t.grad, t.ring)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', t.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        {series && series.length > 1 && (
          <Sparkline data={series} className={t.spark} fill="currentColor" />
        )}
      </div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {prefix}{display}{suffix}
        </span>
        {typeof deltaPct === 'number' && deltaPct !== 0 && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
            positive ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
          )}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(deltaPct)}%
          </span>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
