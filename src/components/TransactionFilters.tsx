import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types/transaction';

interface Filters {
  startDate?: Date;
  endDate?: Date;
  type: TransactionType | 'all';
  search: string;
}

interface TransactionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const quickFilters = [
  {
    label: 'Esta semana',
    getRange: () => ({ start: startOfWeek(new Date(), { locale: ptBR }), end: endOfWeek(new Date(), { locale: ptBR }) }),
  },
  {
    label: 'Este mês',
    getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
  },
  {
    label: 'Mês anterior',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    },
  },
];

export const TransactionFilters = ({ filters, onFiltersChange }: TransactionFiltersProps) => {
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  const handleQuickFilter = (getRange: () => { start: Date; end: Date }) => {
    const { start, end } = getRange();
    onFiltersChange({ ...filters, startDate: start, endDate: end });
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      type: 'all',
      search: '',
    });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.type !== 'all' || filters.search;

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 shadow-card">
      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {quickFilters.map((filter) => (
          <Button
            key={filter.label}
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter(filter.getRange)}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Main Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Start Date */}
        <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !filters.startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy') : 'Data inicial'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate}
              onSelect={(date) => {
                onFiltersChange({ ...filters, startDate: date });
                setStartCalendarOpen(false);
              }}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* End Date */}
        <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !filters.endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy') : 'Data final'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate}
              onSelect={(date) => {
                onFiltersChange({ ...filters, endDate: date });
                setEndCalendarOpen(false);
              }}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Type */}
        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ ...filters, type: value as TransactionType | 'all' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Recebimentos</SelectItem>
            <SelectItem value="expense">Pagamentos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
