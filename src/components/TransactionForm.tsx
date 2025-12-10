import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Transaction, TransactionType, PaymentMethod, paymentMethodLabels } from '@/types/transaction';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  date: z.date({ required_error: 'Selecione uma data' }),
  type: z.enum(['income', 'expense'], { required_error: 'Selecione o tipo' }),
  clientSupplier: z.string().min(1, 'Informe o cliente/fornecedor').max(100),
  amount: z.number({ required_error: 'Informe o valor' }).positive('O valor deve ser positivo'),
  description: z.string().min(1, 'Informe a descrição').max(500),
  paymentMethod: z.enum([
    'dinheiro',
    'pix',
    'cartao_credito',
    'cartao_debito',
    'transferencia',
    'boleto',
    'cheque',
    'outro',
  ], { required_error: 'Selecione a forma de pagamento' }),
});

type FormData = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'user_id'>) => Promise<boolean>;
  canInsertExpense: boolean;
  canInsertIncome: boolean;
}

export const TransactionForm = ({ onSubmit, canInsertExpense, canInsertIncome }: TransactionFormProps) => {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultType = canInsertExpense ? 'expense' : 'income';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      type: defaultType,
    },
  });

  const selectedDate = watch('date');
  const selectedType = watch('type');

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const success = await onSubmit({
      date: data.date,
      type: data.type as TransactionType,
      clientSupplier: data.clientSupplier.trim(),
      amount: data.amount,
      description: data.description.trim(),
      paymentMethod: data.paymentMethod as PaymentMethod,
    });
    setIsSubmitting(false);

    if (success) {
      toast({
        title: data.type === 'income' ? 'Recebimento registrado!' : 'Pagamento registrado!',
        description: `${data.clientSupplier} - R$ ${data.amount.toFixed(2)}`,
      });
      reset({ date: new Date(), type: defaultType });
      setOpen(false);
    }
  };

  const canSelectBoth = canInsertExpense && canInsertIncome;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-md transition-all hover:shadow-lg">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 pt-4">
          {/* Type Selection */}
          {canSelectBoth ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('type', 'income')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  selectedType === 'income'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border bg-card hover:border-success/50'
                )}
              >
                <span className="text-sm font-medium">Recebimento</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'expense')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  selectedType === 'expense'
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border bg-card hover:border-destructive/50'
                )}
              >
                <span className="text-sm font-medium">Pagamento</span>
              </button>
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center rounded-xl border-2 p-4',
                selectedType === 'income'
                  ? 'border-success bg-success/10 text-success'
                  : 'border-destructive bg-destructive/10 text-destructive'
              )}
            >
              <span className="font-medium">
                {selectedType === 'income' ? 'Recebimento' : 'Pagamento'}
              </span>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue('date', date);
                      setCalendarOpen(false);
                    }
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>

          {/* Client/Supplier */}
          <div className="space-y-2">
            <Label htmlFor="clientSupplier">
              {selectedType === 'income' ? 'Cliente' : 'Fornecedor'}
            </Label>
            <Input
              id="clientSupplier"
              placeholder={selectedType === 'income' ? 'Nome do cliente' : 'Nome do fornecedor'}
              {...register('clientSupplier')}
            />
            {errors.clientSupplier && (
              <p className="text-sm text-destructive">{errors.clientSupplier.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder={
                selectedType === 'income'
                  ? 'Descreva o que foi recebido...'
                  : 'Descreva o que foi comprado...'
              }
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Forma de {selectedType === 'income' ? 'Recebimento' : 'Pagamento'}</Label>
            <Select onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
