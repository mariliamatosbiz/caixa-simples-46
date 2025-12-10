import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogOut, Users, Loader2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { SummaryCards } from '@/components/SummaryCards';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionFilters } from '@/components/TransactionFilters';
import { TransactionList } from '@/components/TransactionList';
import { TransactionType } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Filters {
  startDate?: Date;
  endDate?: Date;
  type: TransactionType | 'all';
  search: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, canInsertExpense, canInsertIncome, canDelete } = useAuth();
  const { addTransaction, deleteTransaction, getFilteredTransactions, getSummary, loading } = useTransactions();
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    search: '',
  });

  const filteredTransactions = useMemo(
    () => getFilteredTransactions(filters),
    [getFilteredTransactions, filters]
  );

  const summary = useMemo(
    () => getSummary(filteredTransactions),
    [getSummary, filteredTransactions]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const canAddTransaction = canInsertExpense || canInsertIncome;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground sm:text-xl">Controle de Caixa</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Gerencie suas entradas e saídas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {canAddTransaction && (
              <TransactionForm 
                onSubmit={addTransaction} 
                canInsertExpense={canInsertExpense}
                canInsertIncome={canInsertIncome}
              />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(profile?.full_name || null, profile?.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/users')}>
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <SummaryCards income={summary.income} expense={summary.expense} balance={summary.balance} />

        {/* Filters */}
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />

        {/* Transaction List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Transações</h2>
            <span className="text-sm text-muted-foreground">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <TransactionList 
            transactions={filteredTransactions} 
            onDelete={deleteTransaction}
            canDelete={canDelete}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
