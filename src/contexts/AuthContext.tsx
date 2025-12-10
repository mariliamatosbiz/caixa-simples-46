import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { dbCall } from '@/lib/db';
import { AppRole, UserProfile } from '@/types/transaction';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface DbUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: Array<{ role: AppRole }>;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  canView: boolean;
  canEdit: boolean;
  canInsertExpense: boolean;
  canInsertIncome: boolean;
  canDelete: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'cash_flow_user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const setUserData = (userData: DbUser | null) => {
    if (userData) {
      setUser({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
      });
      setProfile({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        created_at: userData.created_at,
      });
      setRoles(userData.roles.map((r) => r.role));
      localStorage.setItem(USER_STORAGE_KEY, userData.id);
    } else {
      setUser(null);
      setProfile(null);
      setRoles([]);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserId) {
        const { data, error } = await dbCall<DbUser>('getUser', { userId: storedUserId });
        if (data && !error) {
          setUserData(data);
        } else {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await dbCall<DbUser>('login', { email, password });
    
    if (error) {
      return { error: new Error(error) };
    }
    
    if (data) {
      setUserData(data);
    }
    
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await dbCall<DbUser>('signup', { email, password, fullName });
    
    if (error) {
      return { error: new Error(error) };
    }
    
    return { error: null };
  };

  const signOut = async () => {
    setUserData(null);
  };

  const isAdmin = roles.includes('admin');
  const canView = roles.length > 0;
  const canEdit = isAdmin || roles.includes('edit');
  const canInsertExpense = isAdmin || roles.includes('edit') || roles.includes('insert_expenses');
  const canInsertIncome = isAdmin || roles.includes('edit') || roles.includes('insert_income');
  const canDelete = isAdmin || roles.includes('edit');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        signIn,
        signUp,
        signOut,
        canView,
        canEdit,
        canInsertExpense,
        canInsertIncome,
        canDelete,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
