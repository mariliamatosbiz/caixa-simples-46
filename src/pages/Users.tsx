import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, roleLabels } from '@/types/transaction';
import { toast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  role_id: string;
}

const Users = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        toast({ variant: 'destructive', title: 'Erro', description: profilesError.message });
        return;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        toast({ variant: 'destructive', title: 'Erro', description: rolesError.message });
        return;
      }

      const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: (userRole?.role as AppRole) || 'view_only',
          role_id: userRole?.id || '',
        };
      });

      setUsers(usersWithRoles);
      setLoading(false);
    };

    fetchUsers();
  }, [isAdmin, navigate]);

  const handleRoleChange = async (userId: string, roleId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', roleId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast({ title: 'Permissão atualizada!' });
  };

  const handleDeleteUser = async (userId: string) => {
    // Note: This only removes from our tables, not from auth.users
    // In production, you'd use a server-side function to delete from auth.users
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast({ title: 'Usuário removido!' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground sm:text-xl">Gerenciar Usuários</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Configure as permissões dos usuários
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Usuários ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{u.full_name || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={u.role}
                      onValueChange={(value) => handleRoleChange(u.id, u.role_id, value as AppRole)}
                      disabled={u.id === user?.id}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {u.id !== user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O usuário perderá acesso ao sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(u.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descrição das Permissões</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Administrador:</strong> Acesso total ao sistema, pode gerenciar usuários.</li>
              <li><strong className="text-foreground">Somente Visualizar:</strong> Pode ver todas as transações, mas não pode adicionar, editar ou excluir.</li>
              <li><strong className="text-foreground">Editar:</strong> Pode adicionar, editar e excluir qualquer transação.</li>
              <li><strong className="text-foreground">Inserir Pagamentos:</strong> Pode apenas adicionar transações de pagamento (saídas).</li>
              <li><strong className="text-foreground">Inserir Recebimentos:</strong> Pode apenas adicionar transações de recebimento (entradas).</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Users;
