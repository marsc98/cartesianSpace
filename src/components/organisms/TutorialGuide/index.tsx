import React, { useState, useEffect, useRef } from 'react';
import css from './index.module.scss';
import { TUTORIALS } from './data';
import Button from '../../atoms/button';
import { safeSetItem } from '../../../utils/storage';

interface TutorialGuideProps {
  type: string;
  onClose: () => void;
}

function TutorialGuide({ type, onClose }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const tutorial = TUTORIALS[type];
  const steps = tutorial?.steps ?? [];
  const step = steps[currentStep];

  function handleClose() {
    safeSetItem('cartesian_tutorial_seen', 'true');
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    const focusable = cardRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableEls = Array.from(
        cardRef.current!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableEls.length === 0) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

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
  }, []);

  if (!step) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className={css['overlay']}
      onClick={handleBackdropClick}
    >
      <div className={css['card']} ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <button
          className={css['close-btn']}
          aria-label="Fechar tutorial"
          onClick={handleClose}
        />
        <header>
          <h2 id="tutorial-title">{step.title}</h2>
        </header>
        <div className={css['body']} aria-live="polite">
          <p>{step.description}</p>
          {step.visual && (
            <div
              className={`${css['visual']} ${css[step.visual]}`}
              aria-hidden="true"
            />
          )}
        </div>
        <footer className={css['footer']}>
          <Button
            text="Anterior"
            action={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          />
          <span>
            {currentStep + 1} de {steps.length}
          </span>
          {currentStep < steps.length - 1 ? (
            <Button text="Próximo" action={() => setCurrentStep((s) => s + 1)} color="blue" />
          ) : (
            <Button text="Concluir" action={handleClose} color="blue" />
          )}
        </footer>
      </div>
    </div>
  );
}

export default TutorialGuide;
