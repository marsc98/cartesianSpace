import React, { createContext, useContext, useRef, useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunctionRef {
  value: string;
  interval: number;
  pointsSize: number;
}

interface LimitesRef {
  start: number;
  end: number;
}

interface CartesianSpaceRef {
  active: boolean;
  lineSize: number;
  numLines: number;
}

interface FontRef {
  path: string;
  size: number;
  height: number;
  curveSegments: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelOffset: number;
  bevelSegments: number;
}

interface TextRef {
  value: string;
  active: boolean;
}

interface FunctionsStateValue {
  functionsList: unknown[];
  setFunctionsList: React.Dispatch<React.SetStateAction<unknown[]>>;
  functionsOpen: boolean;
  setFunctionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FunctionsRefsValue {
  functionRef: React.MutableRefObject<FunctionRef>;
  limitesRef: React.MutableRefObject<LimitesRef>;
  functionsRef: React.MutableRefObject<unknown[]>;
  cartesianSpaceRef: React.MutableRefObject<CartesianSpaceRef>;
  fontRef: React.MutableRefObject<FontRef>;
  textRef: React.MutableRefObject<TextRef>;
  writingRef: React.MutableRefObject<boolean>;
  axisRef: React.MutableRefObject<boolean>;
  infoRef: React.MutableRefObject<boolean>;
}

export type FunctionsContextValue = FunctionsStateValue & FunctionsRefsValue;

// ─── Contexts ─────────────────────────────────────────────────────────────────

const FunctionsStateContext = createContext<FunctionsStateValue | null>(null);
const FunctionsRefsContext = createContext<FunctionsRefsValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FunctionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [functionsList, setFunctionsList] = useState<unknown[]>([]);
  const [functionsOpen, setFunctionsOpen] = useState(false);

  const functionRef = useRef<FunctionRef>({ value: '', interval: 10, pointsSize: 50 });
  const limitesRef = useRef<LimitesRef>({ start: -10, end: 10 });
  const functionsRef = useRef<unknown[]>([]);
  const cartesianSpaceRef = useRef<CartesianSpaceRef>({ active: false, lineSize: 1, numLines: 10 });
  const fontRef = useRef<FontRef>({
    path: '/fonts/spaceMonoBold.json',
    size: 10, height: 1, curveSegments: 12,
    bevelEnabled: true, bevelThickness: 1,
    bevelSize: 1, bevelOffset: 0, bevelSegments: 5,
  });
  const textRef = useRef<TextRef>({ value: '', active: false });
  const writingRef = useRef(false);
  const axisRef = useRef(false);
  const infoRef = useRef(false);

  const stateValue = useMemo<FunctionsStateValue>(() => ({
    functionsList, setFunctionsList,
    functionsOpen, setFunctionsOpen,
  }), [functionsList, functionsOpen]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refsValue = useMemo<FunctionsRefsValue>(() => ({
    functionRef, limitesRef, functionsRef,
    cartesianSpaceRef, fontRef, textRef,
    writingRef, axisRef, infoRef,
  }), []);

  return (
    <FunctionsStateContext.Provider value={stateValue}>
      <FunctionsRefsContext.Provider value={refsValue}>
        {children}
      </FunctionsRefsContext.Provider>
    </FunctionsStateContext.Provider>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Hook granular — apenas estado reativo. Re-renderiza quando functionsList/functionsOpen mudam. */
export const useFunctionsState = (): FunctionsStateValue => {
  const ctx = useContext(FunctionsStateContext);
  if (!ctx) throw new Error('useFunctionsState must be used within FunctionsProvider');
  return ctx;
};

/** Hook granular — apenas refs estáveis. Não causa re-renders por mudança de estado. */
export const useFunctionsRefs = (): FunctionsRefsValue => {
  const ctx = useContext(FunctionsRefsContext);
  if (!ctx) throw new Error('useFunctionsRefs must be used within FunctionsProvider');
  return ctx;
};

/** Hook combinado — compatibilidade com consumers existentes. */
export const useFunctions = (): FunctionsContextValue => ({
  ...useFunctionsState(),
  ...useFunctionsRefs(),
});
