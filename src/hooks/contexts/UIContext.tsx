import React, { createContext, useContext, useRef, useState, useMemo, useCallback } from 'react';

interface UIContextValue {
  isOwnCursorActive: boolean;
  setIsOwnCursorActive: React.Dispatch<React.SetStateAction<boolean>>;
  uploadFileIsActive: boolean;
  setUploadFileIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  scenesIsOpen: boolean;
  setScenesIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  starsAreActive: boolean;
  setStarsAreActive: React.Dispatch<React.SetStateAction<boolean>>;
  modalIsOpenRef: React.MutableRefObject<boolean>;
  openMenuRef: React.MutableRefObject<boolean>;
  openModalCount: number;
  incrementModalCount: () => void;
  decrementModalCount: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOwnCursorActive, setIsOwnCursorActive] = useState(false);
  const [uploadFileIsActive, setUploadFileIsActive] = useState(false);
  const [scenesIsOpen, setScenesIsOpen] = useState(false);
  const [starsAreActive, setStarsAreActive] = useState(true);
  const [openModalCount, setOpenModalCount] = useState(0);

  const modalIsOpenRef = useRef(false);
  const openMenuRef = useRef(false);

  const incrementModalCount = useCallback(() => setOpenModalCount((n) => n + 1), []);
  const decrementModalCount = useCallback(() => setOpenModalCount((n) => Math.max(0, n - 1)), []);

  const contextValue = useMemo(() => ({
    isOwnCursorActive, setIsOwnCursorActive,
    uploadFileIsActive, setUploadFileIsActive,
    scenesIsOpen, setScenesIsOpen,
    starsAreActive, setStarsAreActive,
    modalIsOpenRef, openMenuRef,
    openModalCount, incrementModalCount, decrementModalCount,
  }), [
    isOwnCursorActive, uploadFileIsActive, scenesIsOpen,
    starsAreActive, openModalCount, incrementModalCount, decrementModalCount,
  ]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextValue => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
