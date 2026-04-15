import { useState } from 'react';
import { ArrowLeft, Globe, Mail, Lock, Eye, EyeOff, Wand2, Trash2 } from 'lucide-react';
import type { ServiceEntry } from '@/lib/store';
import { generatePassword } from '@/lib/crypto';

interface ServiceFormProps {
  service: ServiceEntry | null;
  onSave: (entry: ServiceEntry) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

const ServiceForm = ({ service, onSave, onDelete, onCancel }: ServiceFormProps) => {
  const [name, setName] = useState(service?.name || '');
  const [username, setUsername] = useState(service?.username || '');
  const [password, setPassword] = useState(service?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!service;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) return;

    onSave({
      id: service?.id || crypto.randomUUID(),
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      icon: name.charAt(0).toUpperCase(),
      createdAt: service?.createdAt || Date.now(),
    });
  };

  const handleGenerate = () => {
    setPassword(generatePassword());
    setShowPassword(true);
  };

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">
          {isEditing ? 'Editar Serviço' : 'Adicionar Serviço'}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-5 space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Nome do Serviço</label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Gmail, Instagram..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Usuário ou Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Senha</label>
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
          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Gerar senha forte
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Salvar
          </button>
        </div>

        {/* Delete */}
        {isEditing && onDelete && (
          <>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors mt-4"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Serviço
            </button>

            {showDeleteConfirm && (
              <div className="bg-card border border-border rounded-2xl p-5 mt-3 fade-in">
                <p className="text-sm text-foreground font-medium mb-1">Tem certeza?</p>
                <p className="text-xs text-muted-foreground mb-4">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm bg-secondary text-secondary-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(service!.id)}
                    className="flex-1 py-2.5 rounded-xl text-sm bg-destructive text-destructive-foreground font-medium"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default ServiceForm;
