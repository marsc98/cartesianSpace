import React, { createContext, useContext, useState, useMemo } from 'react';

// 1. Criação do Context
const CoordinatesContext = createContext();

// 2. Criação do Provider
const CoordinatesProvider = ({ children }) => {
  const [coordinatesState, setcoordinatesState] = useState(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));

  const value = useMemo(
    () => ({ coordinatesState, setcoordinatesState }),
    [coordinatesState],
  );

  return (
    <CoordinatesContext.Provider value={value}>
      {children}
    </CoordinatesContext.Provider>
  );
};

const useCoordinates = () => {
  const context = useContext(CoordinatesContext);
  if (!context) {
    throw new Error('useCoordinates deve ser usado dentro de um CoordinatesProvider');
  }
  return context;
};

// 3. Exportação do Context e do Provider
export { CoordinatesProvider, useCoordinates };
