export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'dinheiro' 
  | 'pix' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'transferencia' 
  | 'boleto'
  | 'cheque'
  | 'outro';

export type AppRole = 'admin' | 'view_only' | 'edit' | 'insert_expenses' | 'insert_income';

export interface Transaction {
  id: string;
  user_id: string;
  date: Date;
  type: TransactionType;
  clientSupplier: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cheque: 'Cheque',
  outro: 'Outro',
};

export const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  view_only: 'Somente Visualizar',
  edit: 'Editar',
  insert_expenses: 'Inserir Pagamentos',
  insert_income: 'Inserir Recebimentos',
};
