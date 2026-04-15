import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Wifi } from 'lucide-react';
import { hasMaster, setupMaster, verifyMaster, isLockedOut, recordFailedAttempt, clearAttempts } from '@/lib/store';
import { validateMasterPassword } from '@/lib/crypto';

interface LoginScreenProps {
  onLogin: (password: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(!hasMaster());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const lockStatus = isLockedOut();
    if (lockStatus.locked) {
      setError(`App bloqueado. Tente novamente em ${lockStatus.secondsRemaining}s`);
      return;
    }

    if (isSetup) {
      const validationErrors = validateMasterPassword(password);
      if (validationErrors.length > 0) {
        setError('Senha fraca: ' + validationErrors.join(', '));
        return;
      }
      if (!email.trim()) {
        setError('Informe seu email');
        return;
      }
      setLoading(true);
      await setupMaster(email, password);
      setLoading(false);
      onLogin(password);
    } else {
      setLoading(true);
      const result = await verifyMaster(password);
      setLoading(false);
      if (result.valid) {
        clearAttempts();
        onLogin(password);
      } else {
        const attempt = recordFailedAttempt();
        if (attempt.locked) {
          setError(`Muitas tentativas. Bloqueado por ${attempt.lockoutSeconds}s`);
        } else {
          setError(`Senha incorreta. ${attempt.remainingAttempts} tentativas restantes`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 fade-in">
      {/* Shield icon */}
      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 pulse-lock">
        <Shield className="w-10 h-10 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">Cofre de Senhas</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Seus dados ficam armazenados apenas neste dispositivo.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {isSetup && (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {isSetup ? 'Criar Senha Mestre' : 'Senha Mestre'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        {isSetup && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>A senha mestre deve ter:</p>
            <p className={password.length >= 8 ? 'text-success' : ''}>• Mínimo 8 caracteres</p>
            <p className={/[A-Z]/.test(password) ? 'text-success' : ''}>• Uma letra maiúscula</p>
            <p className={/[0-9]/.test(password) ? 'text-success' : ''}>• Um número</p>
            <p className={/[!@#$%&*]/.test(password) ? 'text-success' : ''}>• Um símbolo (!@#$%&*)</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Carregando...' : isSetup ? 'Criar Cofre' : 'Entrar'}
        </button>
      </form>

      {!isSetup && hasMaster() && (
        <button
          onClick={() => setIsSetup(true)}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Criar novo cofre
        </button>
      )}

      <div className="flex items-center gap-1.5 mt-8 text-xs text-muted-foreground">
        <Wifi className="w-3 h-3 text-success" />
        <span>100% Offline • Dados locais</span>
      </div>
    </div>
  );
};

export default LoginScreen;
