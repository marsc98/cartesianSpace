import React, { useRef, useEffect, useState, useCallback } from 'react';
import css from './index.module.scss';
import Icon from '../../atoms/icon';
import Button from '../../atoms/button';
import { useModal } from '../../../hooks/useModal';
import IconButton from '../iconButton';
import { safeGetItem, safeSetItem } from '../../../utils/storage';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { ModalInstance } from '../../../types';

interface ModalProps {
  setIsOwnCursorActive: (active: boolean) => void;
  modalIsOpenRef: React.MutableRefObject<boolean>;
  id: string;
  modalState: ModalInstance;
  writingRef: React.MutableRefObject<boolean>;
}

function Modal({ setIsOwnCursorActive, modalIsOpenRef, id, modalState, writingRef }: ModalProps) {
  const {
    showSecondary,
    setShowSecondary,
    isTransitioning,
    setIsTransitioning,
    showSecondaryContent,
    showPrimaryContent,
    addModalRef,
    clickIsOnModal,
    removeModal,
    clearModaslList,
    activeModal,
    fixModal,
    unfixModal,
  } = useModal();

  const {
    isOpen,
    title,
    content,
    secondaryContent,
    onClose,
    stopWriting,
    action,
    buttonText,
    buttonColor,
    formId,
    fixed,
    iconName,
  } = modalState;

  const [isInside, setIsInside] = useState(false);
  const [direction, setDirection] = useState('forward');
  const [isClosing, setIsClosing] = useState(false);

  const isDraggingButton = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartPosition = useRef({ top: 0, left: 0 });
  const hasInitialized = useRef(false);

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isFixed, setIsFixed] = useState(fixed || false);

  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isFirstRender = useRef(true);

  const isMobile = useIsMobile();

  const getCenterPosition = () => {
    if (modalRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      const top = (window.innerHeight - modalRect.height) / 2;
      const left = (window.innerWidth - modalRect.width) / 2;
      return { top, left };
    }
    return {
      top: window.innerHeight / 2 - 200,
      left: window.innerWidth / 2 - 250,
    };
  };

  const loadSavedPosition = (): { top: number; left: number } | null => {
    const saved = safeGetItem('modalPosition');
    if (saved) {
      try {
        return JSON.parse(saved) as { top: number; left: number };
      } catch {
        return null;
      }
    }
    return null;
  };

  const savePosition = (pos: { top: number; left: number }) => {
    safeSetItem('modalPosition', JSON.stringify(pos));
  };

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      const savedPosition = loadSavedPosition();
      if (savedPosition) {
        setPosition(savedPosition);
      } else {
        setPosition({ top: 16, left: 16 });
      }

      hasInitialized.current = true;
      modalIsOpenRef.current = true;

      requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      });
    }

    if (!isOpen) {
      hasInitialized.current = false;
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (!clickIsOnModal(e.target as HTMLElement)) {
        clearModaslList();
      }
    };

    const handleTouchOutside = (e: TouchEvent) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (!clickIsOnModal(e.target as HTMLElement)) {
        clearModaslList();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [isOpen, isFixed]);

  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        e.preventDefault();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isFixed]);

  function handleClose() {
    if (isFixed) return;

    setIsClosing(true);
    setTimeout(() => {
      onClose();
      modalIsOpenRef.current = false;
      setIsClosing(false);
    }, 300);
  }

  const handleShowSecondary = () => {
    if (!isTransitioning) {
      setDirection('forward');
      showSecondaryContent();
    }
  };

  const handleShowPrimary = () => {
    if (!isTransitioning) {
      setDirection('backward');
      showPrimaryContent();
    }
  };

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingButton.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartPosition.current = { top: position.top, left: position.left };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (isDraggingButton.current && modalRef.current) {
      e.preventDefault();
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newTop = dragStartPosition.current.top + deltaY;
      const newLeft = dragStartPosition.current.left + deltaX;

      modalRef.current.style.top = `${newTop}px`;
      modalRef.current.style.left = `${newLeft}px`;
    }
  };

  const handleGlobalMouseUp = (e: MouseEvent) => {
    if (isDraggingButton.current && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const newPosition = { top: rect.top, left: rect.left };

      setPosition(newPosition);
      savePosition(newPosition);
      isDraggingButton.current = false;

      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  };

  const handleButtonTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 1) {
      isDraggingButton.current = true;
      const touch = e.touches[0];
      dragStartPos.current = { x: touch.clientX, y: touch.clientY };
      dragStartPosition.current = { top: position.top, left: position.left };

      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (isDraggingButton.current && e.touches.length === 1 && modalRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartPos.current.x;
      const deltaY = touch.clientY - dragStartPos.current.y;

      const newTop = dragStartPosition.current.top + deltaY;
      const newLeft = dragStartPosition.current.left + deltaX;

      modalRef.current.style.top = `${newTop}px`;
      modalRef.current.style.left = `${newLeft}px`;
    }
  };

  const handleGlobalTouchEnd = (e: TouchEvent) => {
    if (isDraggingButton.current && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const newPosition = { top: rect.top, left: rect.left };

      setPosition(newPosition);
      savePosition(newPosition);
      isDraggingButton.current = false;

      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    }
  };

  useEffect(() => {
    setIsOwnCursorActive(false);
    addModalRef(id, modalRef as React.RefObject<HTMLDivElement>);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);

      writingRef.current = false;
    };
  }, []);

  useEffect(() => {
    setIsFixed(fixed ?? false);
  }, [fixed]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${id}`}
      tabIndex={-1}
      onClick={() => activeModal(id)}
      id={id}
      key={id}
      ref={modalRef}
      className={css['modal_container']}
      data-is-closing={isClosing}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div
        onMouseEnter={() => setIsInside(true)}
        onMouseLeave={() => setIsInside(false)}
        className={css['modal_header']}
      >
        <span
          id={`modal-title-${id}`}
          className={css['modal-title']}
          onClick={() => setPosition({ top: 0, left: 0 })}
        >
          {title}
        </span>
        <div className={css['modal-interactors']}>
          <IconButton
            iconName={isFixed ? 'keepOff' : 'keep'}
            hoverText="Fixar janela"
            onClick={() => {
              setIsFixed(!isFixed);
              isFixed ? unfixModal(id) : fixModal(id);
            }}
          />
          <IconButton
            iconName="move"
            hoverText="Mover janela"
            onMouseDown={handleButtonMouseDown}
            onTouchStart={handleButtonTouchStart}
            style={{
              cursor: isDraggingButton.current ? 'grabbing' : 'grab',
              opacity: isDraggingButton.current ? 1 : 0.6,
              userSelect: 'none',
              touchAction: 'none',
            }}
          />
        </div>
      </div>

      <div className={css['modal-content-wrapper']}>
        {!showSecondary && (
          <div
            className={`${css['modal-content']} ${css['card']} ${direction === 'forward' ? css['scale-in'] : css['scale-in']
              }`}
            data-is-closing={isClosing}
          >
            {content && React.isValidElement(content) &&
              React.cloneElement(content, {
                showSecondaryContent: handleShowSecondary,
              } as Record<string, unknown>)}
          </div>
        )}

        {showSecondary && secondaryContent && (
          <div
            className={`${css['modal-content']} ${css['card']} ${css['scale-in']}`}
            data-is-closing={isClosing}
          >
            {React.isValidElement(secondaryContent) && React.cloneElement(secondaryContent, {
              showPrimaryContent: handleShowPrimary,
            } as Record<string, unknown>)}
          </div>
        )}
      </div>

      <div className={css['button-container']} data-icon={iconName && iconName.length > 0}>
        {showSecondary ? (
          <Button
            text="Voltar"
            action={handleShowPrimary}
            type="button"
            color={buttonColor || 'blue'}
          />
        ) : iconName && iconName.length > 0 ? (
          <IconButton
            iconName={iconName}
            hoverText={buttonText}
            onClick={action}
            size="m"
          />
        ) : buttonText ? (
          <Button
            buttonRef={buttonRef}
            text={buttonText}
            action={action}
            type="submit"
            formId={formId}
            color={buttonColor}
          />
        ) : (
          <div></div>
        )}

        {iconName && iconName.length > 0 && <div></div>}

        <Button
          text="Fechar"
          action={() => handleClose()}
          type="button"
          color="red"
        />
      </div>
    </div>
  );
}

export default Modal;
