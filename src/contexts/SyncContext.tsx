import { createContext, useContext, ReactNode } from 'react';

interface SyncContextType {
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'connected' | 'error';
  syncLogs: string[];
  startSync: () => void;
  stopSync: () => void;
  clearLogs: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  return (
    <SyncContext.Provider
      value={{
        isSyncing: false,
        syncStatus: 'connected',
        syncLogs: [],
        startSync: () => {},
        stopSync: () => {},
        clearLogs: () => {},
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
