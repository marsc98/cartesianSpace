import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import type { ModalConfig, ModalInstance } from '../types';

interface ModalContextValue {
  addModal: (modal: ModalConfig) => void;
  removeModal: (id: string) => void;
  modalsList: ModalInstance[];
  clearModaslList: () => void;
  showSecondary: boolean;
  setShowSecondary: React.Dispatch<React.SetStateAction<boolean>>;
  isTransitioning: boolean;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  showSecondaryContent: () => void;
  showPrimaryContent: () => void;
  fixModal: (id: string) => void;
  unfixModal: (id: string) => void;
  addModalRef: (id: string, ref: React.RefObject<HTMLDivElement>) => void;
  clickIsOnModal: (target: HTMLElement) => boolean;
  activeModal: (id: string) => void;
}

// 1. Criação do Context
const ModalContext = createContext<ModalContextValue | null>(null);

// 2. Criação do Provider
const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalsList, setModalsList] = useState<ModalInstance[]>([]);
  const [showSecondary, setShowSecondary] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const modalsListRef = useRef<ModalInstance[]>([]);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    modalsListRef.current = modalsList;
  }, [modalsList]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const showSecondaryContent = useCallback(() => {
    setIsTransitioning(true);
    transitionTimerRef.current = setTimeout(() => {
      setShowSecondary(true);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const showPrimaryContent = useCallback(() => {
    setIsTransitioning(true);
    transitionTimerRef.current = setTimeout(() => {
      setShowSecondary(false);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const modalTypeActive = useCallback(
    (type: string) => modalsList.find((modal) => modal.formId === type),
    [modalsList],
  );

  const addModal = useCallback(
    (modal: ModalConfig) => {
      const id = `modal-${Date.now()}`;
      if (modalTypeActive(modal.formId)) return;
      setModalsList((prevModalsList) => [
        ...prevModalsList,
        { id, isOpen: true, ...modal },
      ]);
    },
    [modalTypeActive],
  );

  const removeModal = useCallback((id: string) => {
    setModalsList((prevModalsList) =>
      prevModalsList.filter((modal) => modal.id !== id && !modal.fixed),
    );
  }, []);

  const fixModal = useCallback((id: string) => {
    setModalsList((prevModalsList) =>
      prevModalsList.map((modal) =>
        modal.id === id ? { ...modal, fixed: true } : modal,
      ),
    );
  }, []);

  const unfixModal = useCallback((id: string) => {
    setModalsList((prevModalsList) =>
      prevModalsList.map((modal) =>
        modal.id === id ? { ...modal, fixed: false } : modal,
      ),
    );
  }, []);

  const addModalRef = useCallback((id: string, ref: React.RefObject<HTMLDivElement>) => {
    setModalsList((prevModalsList) =>
      prevModalsList.map((modal) =>
        modal.id === id ? { ...modal, modalRef: ref } : modal,
      ),
    );
  }, []);

  const clickIsOnModal = useCallback((target: HTMLElement) => {
    return modalsListRef.current.some(
      (modal) => modal?.modalRef?.current?.contains(target),
    );
  }, []);

  const clearModaslList = useCallback(() => {
    setModalsList((prev) => prev.filter((modal) => modal.fixed));
  }, []);

  const activeModal = useCallback(
    (id: string) => {
      modalsList.forEach((modal) => {
        if (modal?.modalRef?.current) {
          modal.modalRef.current.style.zIndex = modal.id === id ? '1000001' : '1000000';
        }
      });
    },
    [modalsList],
  );

  useEffect(() => {
    if (modalsList.length > 0) {
      activeModal(modalsList[modalsList.length - 1].id);
    }
  }, [modalsList, activeModal]);

  const contextValue = useMemo(
    () => ({
      addModal,
      removeModal,
      modalsList,
      clearModaslList,
      showSecondary,
      setShowSecondary,
      isTransitioning,
      setIsTransitioning,
      showSecondaryContent,
      showPrimaryContent,
      fixModal,
      unfixModal,
      addModalRef,
      clickIsOnModal,
      activeModal,
    }),
    [
      addModal,
      removeModal,
      modalsList,
      clearModaslList,
      showSecondary,
      isTransitioning,
      showSecondaryContent,
      showPrimaryContent,
      fixModal,
      unfixModal,
      addModalRef,
      clickIsOnModal,
      activeModal,
    ],
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal deve ser usado dentro de um ModalProvider');
  }
  return context;
};

// 3. Exportação do Context e do Provider
export { ModalProvider, useModal };
