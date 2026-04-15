import { useState } from 'react';
import { Shield, LogOut, Plus, Eye, EyeOff, Copy, Pencil, Search } from 'lucide-react';
import type { ServiceEntry } from '@/lib/store';
import { getServiceColor, getServiceInitial } from '@/lib/icons';
import { toast } from 'sonner';

interface PasswordListProps {
  services: ServiceEntry[];
  onAdd: () => void;
  onEdit: (service: ServiceEntry) => void;
  onLogout: () => void;
}

const PasswordList = ({ services, onAdd, onEdit, onLogout }: PasswordListProps) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPassword = (pw: string) => {
    navigator.clipboard.writeText(pw);
    toast.success('Senha copiada!');
  };

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Cofre de Senhas</h1>
          </div>
          <button onClick={onLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar serviço..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {services.length} {services.length === 1 ? 'serviço salvo' : 'serviços salvos'}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 px-5 pb-24 space-y-2.5">
        {filtered.length === 0 && services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nenhuma senha salva</p>
            <p className="text-xs text-muted-foreground mt-1">Toque no + para adicionar</p>
          </div>
        )}

        {filtered.length === 0 && services.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">Nenhum resultado encontrado</p>
        )}

        {filtered.map(service => (
          <div
            key={service.id}
            className="bg-card border border-border rounded-2xl p-4 transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: getServiceColor(service.name) + '22', color: getServiceColor(service.name) }}
              >
                {getServiceInitial(service.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{service.name}</p>
                <p className="text-xs text-muted-foreground truncate">{service.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground font-mono password-dots">
                    {visiblePasswords.has(service.id) ? service.password : '••••••••'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePassword(service.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {visiblePasswords.has(service.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyPassword(service.password)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(service)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={onAdd}
        className="fixed bottom-6 right-1/2 translate-x-[calc(210px-28px)] w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default PasswordList;
