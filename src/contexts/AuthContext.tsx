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
    await supabase.auth.signOut();
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
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