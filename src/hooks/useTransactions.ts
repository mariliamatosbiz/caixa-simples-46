import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionType, PaymentMethod } from '@/types/transaction';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface DbTransaction {
  id: string;
  user_id: string;
  date: string;
  type: 'income' | 'expense';
  client_supplier: string;
  amount: number;
  description: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

const mapDbToTransaction = (t: DbTransaction): Transaction => ({
  id: t.id,
  user_id: t.user_id,
  date: new Date(t.date),
  type: t.type as TransactionType,
  clientSupplier: t.client_supplier,
  amount: Number(t.amount),
  description: t.description || '',
  paymentMethod: t.payment_method as PaymentMethod,
  createdAt: new Date(t.created_at),
});

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar transações',
        description: error.message,
      });
    } else {
      setTransactions((data || []).map(mapDbToTransaction));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'user_id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        date: transaction.date.toISOString().split('T')[0],
        type: transaction.type,
        client_supplier: transaction.clientSupplier,
        amount: transaction.amount,
        description: transaction.description,
        payment_method: transaction.paymentMethod,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar transação',
        description: error.message,
      });
      return false;
    }

    setTransactions((prev) => [mapDbToTransaction(data), ...prev]);
    return true;
  }, [user]);

  const updateTransaction = useCallback(async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'createdAt' | 'user_id'>>) => {
    const updates: Record<string, unknown> = {};
    if (transaction.date) updates.date = transaction.date.toISOString().split('T')[0];
    if (transaction.type) updates.type = transaction.type;
    if (transaction.clientSupplier) updates.client_supplier = transaction.clientSupplier;
    if (transaction.amount !== undefined) updates.amount = transaction.amount;
    if (transaction.description !== undefined) updates.description = transaction.description;
    if (transaction.paymentMethod) updates.payment_method = transaction.paymentMethod;

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar transação',
        description: error.message,
      });
      return false;
    }

    await fetchTransactions();
    return true;
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir transação',
        description: error.message,
      });
      return false;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  const getFilteredTransactions = useCallback(
    (filters: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType | 'all';
      search?: string;
    }) => {
      return transactions.filter((t) => {
        if (filters.startDate && t.date < filters.startDate) return false;
        if (filters.endDate && t.date > filters.endDate) return false;
        if (filters.type && filters.type !== 'all' && t.type !== filters.type) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            t.clientSupplier.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });
    },
    [transactions]
  );

  const getSummary = useCallback(
    (filteredTransactions: Transaction[]) => {
      const income = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        income,
        expense,
        balance: income - expense,
      };
    },
    []
  );

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getFilteredTransactions,
    getSummary,
    refetch: fetchTransactions,
  };
};
