import React, { createContext, useContext, useState, useMemo } from 'react';

interface HistorySizeState {
  past: number;
  future: number;
}

interface HistoryContextValue {
  historySize: HistorySizeState;
  setHistorySize: React.Dispatch<React.SetStateAction<HistorySizeState>>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [historySize, setHistorySize] = useState<HistorySizeState>({ past: 0, future: 0 });

  const contextValue = useMemo(
    () => ({ historySize, setHistorySize }),
    [historySize],
  );

  return (
    <HistoryContext.Provider value={contextValue}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextValue => {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
};
