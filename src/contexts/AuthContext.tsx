import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, clinicName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    // Sistema gratuito - sempre definir como subscribed
    setSubscribed(true);
    setSubscriptionTier('premium');
    setSubscriptionEnd(null);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Sistema gratuito - sempre ativo
        if (session?.user) {
          setSubscribed(true);
          setSubscriptionTier('premium');
          setSubscriptionEnd(null);
        } else {
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Sistema gratuito - sempre ativo
      if (session?.user) {
        setSubscribed(true);
        setSubscriptionTier('premium');
        setSubscriptionEnd(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, clinicName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          clinic_name: clinicName,
        }
      }
    });
    
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        // Mesmo com erro (ex.: session_not_found), seguimos limpando o estado local
        console.warn('Logout warning:', error.message);
        toast({
          title: "Aviso ao sair",
          description: "Sua sessão já não existia no servidor, mas limpamos o login local.",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Logout unexpected error', error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado ao fazer logout.",
        variant: "destructive",
      });
    } finally {
      // Limpeza garantida do estado local
      setUser(null);
      setSession(null);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      
      // Força limpeza de tokens locais do Supabase (fallback defensivo)
      try {
        const ref = 'srsaglsokrqnujwcbqkc';
        Object.keys(localStorage)
          .filter((k) => k.startsWith(`sb-${ref}-auth-token`))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  };

  const value = {
    user,
    session,
    loading,
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    signIn,
    signUp,
    signOut,
    checkSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};