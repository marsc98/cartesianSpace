import React, { createContext, useContext, useRef, useState, useMemo } from 'react';

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
}

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOwnCursorActive, setIsOwnCursorActive] = useState(false);
  const [uploadFileIsActive, setUploadFileIsActive] = useState(false);
  const [scenesIsOpen, setScenesIsOpen] = useState(false);
  const [starsAreActive, setStarsAreActive] = useState(true);

  const modalIsOpenRef = useRef(false);
  const openMenuRef = useRef(false);

  const contextValue = useMemo(() => ({
    isOwnCursorActive, setIsOwnCursorActive,
    uploadFileIsActive, setUploadFileIsActive,
    scenesIsOpen, setScenesIsOpen,
    starsAreActive, setStarsAreActive,
    modalIsOpenRef, openMenuRef,
  }), [
    isOwnCursorActive, uploadFileIsActive, scenesIsOpen,
    starsAreActive,
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
