import React from 'react';
import { UnitsProvider } from '../hooks/contexts/UnitsContext';
import { SessionProvider } from '../hooks/contexts/SessionContext';
import { UIProvider } from '../hooks/contexts/UIContext';
import { SceneProvider } from '../hooks/contexts/SceneContext';
import { HistoryProvider } from '../hooks/contexts/HistoryContext';
import { CameraProvider } from '../hooks/contexts/CameraContext';
import { DrawingProvider } from '../hooks/contexts/DrawingContext';
import { FunctionsProvider } from '../hooks/contexts/FunctionsContext';
import { ElementsProvider } from '../hooks/contexts/ElementsContext';

export const AppProviders = ({ children }) => (
  <UnitsProvider>
    <SessionProvider>
      <UIProvider>
        <SceneProvider>
          <HistoryProvider>
            <CameraProvider>
              <DrawingProvider>
                <FunctionsProvider>
                  <ElementsProvider>
                    {children}
                  </ElementsProvider>
                </FunctionsProvider>
              </DrawingProvider>
            </CameraProvider>
          </HistoryProvider>
        </SceneProvider>
      </UIProvider>
    </SessionProvider>
  </UnitsProvider>
);
