import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useScene } from './contexts/SceneContext';
import { useFunctions } from './contexts/FunctionsContext';
import { reconstructElements } from '../components/organisms/Board3d/spaceElements';
import type { AnyElement, Sketch, SketchSummary } from '../types';
import type { ElementGroup } from '../types/sketch';

// 1. Inicialização do IndexedDB
let _dbPromise: Promise<IDBDatabase> | null = null;
const getDB = (): Promise<IDBDatabase> => {
  if (!_dbPromise) _dbPromise = initDB();
  return _dbPromise;
};

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lousa', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sketches')) {
        db.createObjectStore('sketches', { keyPath: 'id' });
      }
    };
  });
};

// 2. Operações do banco
const dbOperations = {
  getAllSketches: async () => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sketches', 'readonly');
      const store = transaction.objectStore('sketches');
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sketches = request.result as Sketch[];
        const sortedSketches = sketches.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        resolve(sortedSketches);
      };
    });
  },

  getLatestSketch: async (): Promise<Sketch | null> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sketches', 'readonly');
      const store = transaction.objectStore('sketches');
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sketches = request.result as Sketch[];
        if (sketches.length === 0) {
          resolve(null);
        } else {
          const latest = sketches.reduce((prev, current) =>
            new Date(current.updatedAt).getTime() > new Date(prev.updatedAt).getTime()
              ? current
              : prev,
          );
          resolve(latest);
        }
      };
    });
  },

  getSketchById: async (id) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sketches', 'readonly');
      const store = transaction.objectStore('sketches');
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  },

  addSketch: async (sketch) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sketches', 'readwrite');
      const store = transaction.objectStore('sketches');
      const request = store.add(sketch);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  updateSketch: async (sketch) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sketches', 'readwrite');
      const store = transaction.objectStore('sketches');
      const request = store.put(sketch);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  deleteSketch: async (id) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sketches', 'readwrite');
      const store = transaction.objectStore('sketches');
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },
};

// 3. Criação do Context
export interface SketchContextType {
  elements: AnyElement[];
  setElements: React.Dispatch<React.SetStateAction<AnyElement[]>>;
  currentSketch: Sketch | null;
  setCurrentSketch: React.Dispatch<React.SetStateAction<Sketch | null>>;
  isLoading: boolean;
  allSketches: SketchSummary[];
  addElement: (element: AnyElement) => AnyElement;
  queueElement: (element: AnyElement) => AnyElement;
  flushQueue: () => void;
  deleteElementsById: (ids: string | string[]) => void;
  updateElementById: (id: string, updates: Partial<AnyElement>) => void;
  addSketch: (name?: string) => Promise<Sketch>;
  deleteSketch: (sketchId: string) => Promise<void>;
  updateSketch: (updates?: Partial<Sketch>) => Promise<Sketch>;
  getSketchById: (id: string) => Promise<Sketch | null>;
  getAllSketches: () => Promise<SketchSummary[]>;
  createNewSketch: (name?: string) => Promise<Sketch>;
  getLatestSketch: () => Promise<Sketch | null>;
  updateMultipleElements: (updates: Partial<AnyElement>[]) => void;
  groupElements: (memberIds: string[]) => ElementGroup;
  ungroupAll: (groupId: string) => void;
  ungroupSingle: (elementId: string) => void;
  getGroupMembers: (groupId: string) => AnyElement[];
  updateGroupsOnly: (groups: ElementGroup[]) => void;
}

const SketchContext = createContext<SketchContextType | null>(null);

// 4. Criação do Provider
const SketchProvider = ({ children }: { children: React.ReactNode }) => {
  const [elements, setElements] = useState<AnyElement[]>([]);
  const [currentSketch, setCurrentSketch] = useState<Sketch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allSketches, setAllSketches] = useState<SketchSummary[]>([]);
  const currentSketchRef = useRef<Sketch | null>(null);
  const elementsRef = useRef<AnyElement[]>([]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    currentSketchRef.current = currentSketch;
  }, [currentSketch]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  const { sceneRef, elementsStackRef, particleRef } = useScene();
  const { cartesianSpaceRef, functionsRef } = useFunctions();

  // Carregar última sketch ao montar
  useEffect(() => {
    const loadLatestSketch = async () => {
      try {
        const latest = await dbOperations.getLatestSketch();
        if (latest) {
          setCurrentSketch(latest);
          setElements(latest.data);

          reconstructElements(
            latest.data,
            sceneRef,
            elementsStackRef,
            cartesianSpaceRef,
            undefined,
            addElement,
            particleRef,
            functionsRef,
          );
        } else {
          await createNewSketch();
        }
      } catch (error) {
        console.error('Erro ao carregar sketch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isFirstRender.current) {
      loadLatestSketch();
      isFirstRender.current = false;
    }
  }, []);

  // Salvar ao desmontar o componente
  useEffect(() => {
    return () => {
      const sketch = currentSketchRef.current;
      const els = elementsRef.current;
      if (sketch && els.length > 0) {
        dbOperations.updateSketch({
          ...sketch,
          data: els,
          updatedAt: new Date().toISOString(),
        });
      }
    };
  }, []);

  // Adicionar elemento no array
  const addElement = useCallback((element) => {
    setElements((prev) => [...prev, element]);
    return element;
  }, []);

  const queueElement = useCallback((element: AnyElement) => {
    elementsRef.current = [...elementsRef.current, element];
    return element;
  }, []);

  const flushQueue = useCallback(() => {
    setElements([...elementsRef.current]);
  }, []);

  // Deletar um ou mais elementos pelo ID
  const deleteElementsById = useCallback((ids) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    setElements((prev) => {
      const newElements = prev.filter((el) => !idsArray.includes(el.id));
      if (currentSketchRef.current) {
        dbOperations.updateSketch({
          ...currentSketchRef.current,
          data: newElements,
          updatedAt: new Date().toISOString(),
        });
      }
      return newElements;
    });
  }, []);

  // Atualizar um elemento do array pelo ID
  const updateElementById = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    );
  }, []);

  // Adicionar uma nova sketch no banco
  const addSketch = useCallback(
    async (name) => {
      try {
        const newSketch = {
          id: Math.random().toString(36).substr(2, 9),
          name: name || `Sketch ${new Date().toLocaleString()}`,
          data: elementsRef.current,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbOperations.addSketch(newSketch);
        setCurrentSketch(newSketch);
        setElements([]);
        await getAllSketches();
        return newSketch;
      } catch (error) {
        console.error('Erro ao adicionar sketch:', error);
        throw error;
      }
    },
    [],
  );

  // Deletar uma sketch do banco
  const deleteSketch = useCallback(
    async (sketchId) => {
      try {
        await dbOperations.deleteSketch(sketchId);
        if (currentSketchRef.current?.id === sketchId) {
          const latest = await dbOperations.getLatestSketch();
          if (latest) {
            setCurrentSketch(latest);
            setElements(latest.data || []);
          } else {
            await addSketch('Nova Sketch');
          }
        }
        await getAllSketches();
      } catch (error) {
        console.error('Erro ao deletar sketch:', error);
        throw error;
      }
    },
    [addSketch],
  );

  // Atualizar uma sketch do banco
  const updateSketch = useCallback(
    async (updates) => {
      try {
        let updatedSketch;

        if (!updates) {
          updatedSketch = {
            ...currentSketchRef.current,
            data: elementsRef.current,
            updatedAt: new Date().toISOString(),
          };
          await dbOperations.updateSketch(updatedSketch);
          setCurrentSketch(updatedSketch);
        } else {
          updatedSketch = {
            ...currentSketchRef.current,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          await dbOperations.updateSketch(updatedSketch);
          setCurrentSketch(updatedSketch);
          setElements(updatedSketch.data || []);
        }
        await getAllSketches();
        return updatedSketch;
      } catch (error) {
        console.error('Erro ao atualizar sketch:', error);
        throw error;
      }
    },
    [],
  );

  // Obter uma sketch específica pelo ID
  const getSketchById = useCallback(async (id) => {
    try {
      const sketch = await dbOperations.getSketchById(id);
      return sketch;
    } catch (error) {
      console.error('Erro ao buscar sketch:', error);
      throw error;
    }
  }, []);

  // Obter todas as sketches
  const getAllSketches = useCallback(async () => {
    try {
      const sketches = await dbOperations.getAllSketches() as Sketch[];
      const processedSketches: SketchSummary[] = sketches.map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        elementCount: s.data?.length || 0,
        data: s.data || [],
      }));
      setAllSketches(processedSketches);
      return processedSketches;
    } catch (error) {
      console.error('Erro ao carregar todas as sketches:', error);
      throw error;
    }
  }, []);

  const getLatestSketch = useCallback(async (): Promise<Sketch | null> => {
    try {
      const latest = await dbOperations.getLatestSketch();
      return latest;
    } catch (error) {
      console.error('Erro ao buscar última sketch:', error);
      throw error;
    }
  }, []);

  const updateMultipleElements = useCallback((updates) => {
    setElements((prev) => {
      return prev.map((el) => {
        const updateForThisElement = updates.find((u) => u.id === el.id);
        if (updateForThisElement) {
          return { ...el, ...updateForThisElement };
        }
        return el;
      });
    });
  }, []);

  const groupElements = useCallback((memberIds: string[]): ElementGroup => {
    const groupId = Math.random().toString(36).substr(2, 9);
    const group: ElementGroup = { id: groupId, memberIds };

    const updatedElements = elementsRef.current.map((el) =>
      memberIds.includes(el.id) ? { ...el, groupId } : el,
    );
    setElements(updatedElements);

    const currentGroups = (currentSketchRef.current as any)?.groups ?? [];
    const newGroups = [...currentGroups, group];

    if (currentSketchRef.current) {
      const updatedSketch = {
        ...currentSketchRef.current,
        data: updatedElements,
        groups: newGroups,
        updatedAt: new Date().toISOString(),
      };
      dbOperations.updateSketch(updatedSketch);
      setCurrentSketch(updatedSketch as any);
    }

    return group;
  }, []);

  const ungroupAll = useCallback((groupId: string): void => {
    const updatedElements = elementsRef.current.map((el) =>
      (el as any).groupId === groupId ? { ...el, groupId: undefined } : el,
    );
    setElements(updatedElements);

    const currentGroups = (currentSketchRef.current as any)?.groups ?? [];
    const newGroups = currentGroups.filter((g: ElementGroup) => g.id !== groupId);

    if (currentSketchRef.current) {
      const updatedSketch = {
        ...currentSketchRef.current,
        data: updatedElements,
        groups: newGroups,
        updatedAt: new Date().toISOString(),
      };
      dbOperations.updateSketch(updatedSketch);
      setCurrentSketch(updatedSketch as any);
    }
  }, []);

  const ungroupSingle = useCallback((elementId: string): void => {
    setElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, groupId: undefined } : el)),
    );
  }, []);

  const getGroupMembers = useCallback((groupId: string): AnyElement[] => {
    return elementsRef.current.filter((el) => (el as any).groupId === groupId);
  }, []);

  const updateGroupsOnly = useCallback((groups: ElementGroup[]): void => {
    if (!currentSketchRef.current) return;
    const updatedSketch = {
      ...currentSketchRef.current,
      groups,
      updatedAt: new Date().toISOString(),
    };
    dbOperations.updateSketch(updatedSketch);
    setCurrentSketch(updatedSketch as any);
  }, []);

  // Criar nova sketch limpa
  const createNewSketch = useCallback(
    async (name) => {
      return addSketch(name);
    },
    [addSketch],
  );

  const contextValue = useMemo(() => ({
    elements,
    setElements,
    currentSketch,
    setCurrentSketch,
    isLoading,
    allSketches,
    addElement,
    queueElement,
    flushQueue,
    deleteElementsById,
    updateElementById,
    addSketch,
    deleteSketch,
    updateSketch,
    getSketchById,
    getAllSketches,
    createNewSketch,
    getLatestSketch,
    updateMultipleElements,
    groupElements,
    ungroupAll,
    ungroupSingle,
    getGroupMembers,
    updateGroupsOnly,
  }), [
    elements,
    currentSketch,
    isLoading,
    allSketches,
    addElement,
    queueElement,
    flushQueue,
    deleteElementsById,
    updateElementById,
    addSketch,
    deleteSketch,
    updateSketch,
    getSketchById,
    getAllSketches,
    createNewSketch,
    getLatestSketch,
    updateMultipleElements,
    groupElements,
    ungroupAll,
    ungroupSingle,
    getGroupMembers,
    updateGroupsOnly,
  ]);

  return (
    <SketchContext.Provider value={contextValue}>
      {children}
    </SketchContext.Provider>
  );
};

// 5. Hook para usar o contexto
const useSketch = () => {
  const context = useContext(SketchContext);
  if (!context) {
    throw new Error('useSketch deve ser usado dentro de um SketchProvider');
  }
  return context;
};

// 6. Exportação
export { SketchProvider, useSketch };
