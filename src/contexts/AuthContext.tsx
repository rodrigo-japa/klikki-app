import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  userName: string;
  userInitials: string;
  favorites: string[];
  isFavorite: (anuncianteId: string | number) => boolean;
  toggleFavorite: (anuncianteId: string | number) => Promise<'unauthenticated' | 'added' | 'removed'>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load favorites when user changes
  const loadFavorites = async (userId: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return;
    try {
      const { data, error } = await supabase
        .from('favoritos')
        .select('anunciante_id')
        .eq('user_id', userId);

      if (error) {
        console.warn('Consulta à tabela favoritos:', error.message);
      } else if (data) {
        const ids = data.map((row) => String(row.anunciante_id));
        setFavorites(ids);
      }
    } catch (err) {
      console.warn('Erro ao carregar favoritos:', err);
    }
  };

  useEffect(() => {
    // 1. Fetch initial session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Erro ao obter sessão do Supabase:', error);
        }
        setSession(data.session);
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          loadFavorites(currentUser.id);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error('Falha ao inicializar autenticação:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        loadFavorites(currentUser.id);
      } else {
        setFavorites([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isFavorite = (anuncianteId: string | number): boolean => {
    return Array.isArray(favorites) && favorites.includes(String(anuncianteId));
  };

  const toggleFavorite = async (
    anuncianteId: string | number
  ): Promise<'unauthenticated' | 'added' | 'removed'> => {
    if (!user) {
      return 'unauthenticated';
    }

    const idStr = String(anuncianteId);
    const currentlyFav = Array.isArray(favorites) && favorites.includes(idStr);

    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      user.id
    );

    if (currentlyFav) {
      // Remove
      setFavorites((prev) => (prev || []).filter((id) => id !== idStr));
      showToast('Removido dos seus favoritos.', 'success');
      if (isUserUuid) {
        try {
          const { error } = await supabase
            .from('favoritos')
            .delete()
            .eq('user_id', user.id)
            .eq('anunciante_id', idStr);
          if (error) console.warn('Supabase delete favorito error:', error.message);
        } catch (err) {
          console.warn('Erro ao remover favorito no banco:', err);
        }
      }
      return 'removed';
    } else {
      // Add
      setFavorites((prev) => [...(prev || []), idStr]);
      showToast('Adicionado aos favoritos!', 'success');
      if (isUserUuid) {
        try {
          const { error } = await supabase.from('favoritos').insert({
            user_id: user.id,
            anunciante_id: idStr,
          });
          if (error) console.warn('Supabase insert favorito error:', error.message);
        } catch (err) {
          console.warn('Erro ao inserir favorito no banco:', err);
        }
      }
      return 'added';
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setFavorites([]);
      showToast('Você saiu da sua conta.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao sair da conta';
      showToast(msg, 'error');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao conectar com o Google';
      showToast(msg, 'error');
    }
  };

  // Helper to extract display name and initials
  const rawName: string =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '';

  const userName = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : 'Usuário';

  const userInitials = rawName
    ? rawName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'U';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        toast,
        showToast,
        hideToast,
        signOut,
        signInWithGoogle,
        userName,
        userInitials,
        favorites: favorites || [],
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
