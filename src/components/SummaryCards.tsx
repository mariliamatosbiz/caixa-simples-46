import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const SummaryCards = ({ income, expense, balance }: SummaryCardsProps) => {
  const cards = [
    {
      title: 'Entradas',
      value: income,
      icon: ArrowUpCircle,
      variant: 'success' as const,
    },
    {
      title: 'Saídas',
      value: expense,
      icon: ArrowDownCircle,
      variant: 'destructive' as const,
    },
    {
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      variant: 'primary' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={cn(
            'relative overflow-hidden rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-elevated',
            'animate-fade-in'
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <p
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  card.variant === 'success' && 'text-success',
                  card.variant === 'destructive' && 'text-destructive',
                  card.variant === 'primary' && (card.value >= 0 ? 'text-primary' : 'text-destructive')
                )}
              >
                {formatCurrency(card.value)}
              </p>
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                card.variant === 'success' && 'bg-success/10 text-success',
                card.variant === 'destructive' && 'bg-destructive/10 text-destructive',
                card.variant === 'primary' && 'bg-primary/10 text-primary'
              )}
            >
              <card.icon className="h-6 w-6" />
            </div>
          </div>
          <div
            className={cn(
              'absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5',
              card.variant === 'success' && 'bg-success',
              card.variant === 'destructive' && 'bg-destructive',
              card.variant === 'primary' && 'bg-primary'
            )}
          />
        </div>
      ))}
    </div>
  );
};
