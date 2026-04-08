import React, { createContext, useContext, useState } from 'react';

export interface HelpersState {
  isOpen: boolean;
  list: any[];
  title: string;
  isIconActive: boolean;
}

export interface HelpersContextType {
  helpersState: HelpersState;
  setHelpersState: React.Dispatch<React.SetStateAction<HelpersState>>;
}

const HelpersContext = createContext<HelpersContextType | null>(null);

const HelpersProvider = ({ children }: { children: React.ReactNode }) => {

  const [helpersState, setHelpersState] = useState<HelpersState>({
    isOpen: false,
    list: [],
    title: '',
    isIconActive: false
  });

  return (
    <HelpersContext.Provider value={{ helpersState, setHelpersState }}>
      {children}
    </HelpersContext.Provider>
  );
};

const useHelpers = () => {
  const context = useContext(HelpersContext);
  if (!context) {
    throw new Error('useHelpers deve ser usado dentro de um HelpersProvider');
  }
  return context;
};

export { HelpersProvider, useHelpers };


