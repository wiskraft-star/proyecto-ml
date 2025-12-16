
import React, { useState } from 'react';
import Button from './ui/Button';
import { RefreshCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { SyncResult } from '../types';

interface SyncButtonProps {
    label: string;
    syncFn: () => Promise<SyncResult>;
    onSyncComplete: () => void;
}

const SyncButton: React.FC<SyncButtonProps> = ({ label, syncFn, onSyncComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncFn();
      addNotification(`Sincronización completa. Insertados: ${result.inserted}, Actualizados: ${result.updated}.`, 'success');
      onSyncComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      addNotification(`Error en la sincronización: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSync} isLoading={isLoading} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Sincronizando...' : label}
    </Button>
  );
};

export default SyncButton;
