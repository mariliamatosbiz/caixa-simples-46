import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Transaction, paymentMethodLabels } from '@/types/transaction';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  canDelete?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const TransactionList = ({ transactions, onDelete, canDelete = false }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-16 text-center shadow-card">
        <div className="mb-4 rounded-full bg-muted p-4">
          <ArrowUpCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-foreground">Nenhuma transação</h3>
        <p className="text-sm text-muted-foreground">
          Comece adicionando uma nova transação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => (
        <div
          key={transaction.id}
          className={cn(
            'group flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all hover:shadow-elevated',
            'animate-fade-in'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Icon */}
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              transaction.type === 'income'
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {transaction.type === 'income' ? (
              <ArrowUpCircle className="h-6 w-6" />
            ) : (
              <ArrowDownCircle className="h-6 w-6" />
            )}
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">
                {transaction.clientSupplier}
              </span>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {paymentMethodLabels[transaction.paymentMethod]}
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{transaction.description}</p>
            <p className="text-xs text-muted-foreground">
              {format(transaction.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Amount */}
          <div className="shrink-0 text-right">
            <p
              className={cn(
                'text-lg font-semibold',
                transaction.type === 'income' ? 'text-success' : 'text-destructive'
              )}
            >
              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Actions */}
          {canDelete && (
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A transação será permanentemente removida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(transaction.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
};
