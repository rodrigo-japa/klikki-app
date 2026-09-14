import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
}) => {
  const { showToast } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setShowPassword(false);
  };

  const handleTabChange = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (tab === 'register' && !fullName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw error;
        }

        const greetingName =
          data.user?.user_metadata?.full_name ||
          data.user?.email?.split('@')[0] ||
          '';
        showToast(
          greetingName
            ? `Bem-vindo(a) de volta, ${greetingName}!`
            : 'Bem-vindo ao Klikki!',
          'success'
        );
        resetForm();
        onClose();
      } else {
        // Sign Up with full_name in options.data
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          if (error.message?.toLowerCase().includes('already registered')) {
            throw new Error('Este e-mail já possui cadastro. Faça login.');
          }
          throw error;
        }

        // Supabase may require email confirmation or log the user in immediately
        if (data.session) {
          showToast('Conta criada com sucesso! Bem-vindo ao Klikki!', 'success');
        } else {
          showToast(
            'Cadastro realizado! Verifique seu e-mail para confirmar a conta.',
            'success'
          );
        }

        resetForm();
        onClose();
      }
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err);
      const msg =
        err instanceof Error ? err.message : 'Ocorreu um erro ao processar seu acesso.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      console.error('Erro com Google OAuth:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar com o Google no momento.';
      setErrorMessage(msg);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="auth-modal-card"
        className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-orange-500/10 text-orange-600 mb-3">
            <span className="font-extrabold text-2xl tracking-tighter">K</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            {tab === 'login' ? 'Acesse sua conta' : 'Crie sua conta no Klikki'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {tab === 'login'
              ? 'Entre para gerenciar seus anúncios e preferências'
              : 'Junte-se à maior rede local de prestadores e clientes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          id="auth-tabs"
          className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6"
        >
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => handleTabChange('login')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            id="tab-btn-register"
            onClick={() => handleTabChange('register')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="auth-error-alert"
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          {tab === 'register' && (
            <div>
              <label
                htmlFor="register-full-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="register-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Senha
              </label>
              {tab === 'login' && (
                <span className="text-[11px] text-slate-400 hover:text-orange-600 cursor-pointer">
                  Esqueceu a senha?
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'Mínimo de 6 caracteres' : '••••••••'}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-auth-submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : tab === 'login' ? (
              <span>Entrar</span>
            ) : (
              <span>Criar Conta Gratuita</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">ou</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          id="btn-google-auth"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Continuar com o Google</span>
        </button>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-400 mt-5">
          Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade do Klikki.
        </p>
      </div>
    </div>
  );
};
