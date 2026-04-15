import { useState, useCallback, useEffect, useRef } from 'react';
import LoginScreen from '@/components/LoginScreen';
import PasswordList from '@/components/PasswordList';
import ServiceForm from '@/components/ServiceForm';
import type { ServiceEntry } from '@/lib/store';
import { getServices, saveServices } from '@/lib/store';

type Screen = 'login' | 'list' | 'add' | 'edit';

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes

const Index = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const [masterPassword, setMasterPassword] = useState('');
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [editingService, setEditingService] = useState<ServiceEntry | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (screen !== 'login') {
      timerRef.current = setTimeout(() => {
        setMasterPassword('');
        setServices([]);
        setScreen('login');
      }, INACTIVITY_TIMEOUT);
    }
  }, [screen]);

  useEffect(() => {
    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  const handleLogin = async (password: string) => {
    setMasterPassword(password);
    const data = await getServices(password);
    setServices(data);
    setScreen('list');
  };

  const handleSave = async (entry: ServiceEntry) => {
    let updated: ServiceEntry[];
    if (editingService) {
      updated = services.map(s => s.id === entry.id ? entry : s);
    } else {
      updated = [...services, entry];
    }
    await saveServices(updated, masterPassword);
    setServices(updated);
    setEditingService(null);
    setScreen('list');
  };

  const handleDelete = async (id: string) => {
    const updated = services.filter(s => s.id !== id);
    await saveServices(updated, masterPassword);
    setServices(updated);
    setEditingService(null);
    setScreen('list');
  };

  const handleLogout = () => {
    setMasterPassword('');
    setServices([]);
    setScreen('login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-[420px] min-h-screen relative">
        {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
        {screen === 'list' && (
          <PasswordList
            services={services}
            onAdd={() => { setEditingService(null); setScreen('add'); }}
            onEdit={(s) => { setEditingService(s); setScreen('edit'); }}
            onLogout={handleLogout}
          />
        )}
        {(screen === 'add' || screen === 'edit') && (
          <ServiceForm
            service={editingService}
            onSave={handleSave}
            onDelete={editingService ? handleDelete : undefined}
            onCancel={() => { setEditingService(null); setScreen('list'); }}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
