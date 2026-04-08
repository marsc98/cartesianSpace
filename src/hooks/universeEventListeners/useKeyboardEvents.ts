import { useCallback } from 'react';
import type { UniverseContext } from '../../types/universe';

export const useKeyboardEvents = (ctx: UniverseContext, {
  setLinePoints,
  setAwaitingSecondClick,
  drawingRef,
  setIsOwnCursorActive,
  controlsRef,
  writingRef,
  modalIsOpenRef,
  undo,
  redo,
}: any) => {
  const {
    moveCamera,
    addText,
    handleCreativity,
    handleStopAll,
    handleElementsSelection,
    handleCartesianSpaceDraw,
    handleRuler,
    handleFunctionsControls,
    handleSpaceClean,
    handleInfo,
    handleMarkPosition,
    handleCalculator,
    updateSketch,
    notify,
    handleSavedScenes,
    handleMountains,
    setIsWriting,
    setIsDrawing,
  } = ctx;

  const handleKeyDown = useCallback(
    (e: any) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLinePoints([]);
        setAwaitingSecondClick(false);

        if (!modalIsOpenRef.current) {
          drawingRef.current = false;
          setIsDrawing(false);
          setIsOwnCursorActive(false);
        }
      }

      if (e.key === 'Shift') controlsRef.current.shiftPressed = true;
      if (e.key === 'Control') {
        controlsRef.current.controlPressed = true;
      }

      if (!writingRef.current) {
        if (e.key === 'ArrowUp') {
          if (controlsRef.current.controlPressed) moveCamera('up', 1);
          else moveCamera('forward', 1);
        }
        if (e.key === 'ArrowDown') {
          if (controlsRef.current.controlPressed) moveCamera('down', 1);
          else moveCamera('backward', 1);
        }
        if (e.key === 'ArrowLeft') moveCamera('left', 1);
        if (e.key === 'ArrowRight') moveCamera('right', 1);
        if (e.key === 'PageUp') moveCamera('up', 1);
        if (e.key === 'PageDown') moveCamera('down', 1);
        
        if (e.key === 't' || e.key === 'T') {
          writingRef.current = true;
          setIsWriting(true);
          addText();
        }
        if (e.key === 'd' || e.key === 'D') handleCreativity();
        if (e.key === 'b' || e.key === 'B') {
          handleStopAll();
          handleElementsSelection();
        }
        if (e.key === 'g' || e.key === 'G') handleCartesianSpaceDraw();
        if (
          (e.key === 'r' || e.key === 'R') &&
          !controlsRef.current.controlPressed
        )
          handleRuler();
        if (e.key === 'z' || e.key === 'Z') {
          if (!controlsRef.current.controlPressed) return;

          if (controlsRef.current.shiftPressed) {
            redo();
            notify('backspace', 'neutral', { duration: 1000, style: 'flip' });
          } else {
            undo();
            notify('backspace', 'neutral', { duration: 1000 });
          }
        }
        if (e.key === 'f' || e.key === 'F') {
          handleFunctionsControls();
        }
        if (e.key === 'l' || e.key === 'L') handleSpaceClean();
        if (
          (e.key === 'i' || e.key === 'I') &&
          !controlsRef.current.controlPressed
        )
          handleInfo();
        if (e.key === 'p' || e.key === 'P') handleMarkPosition();
        if (e.key === 'c' || e.key === 'C') {
          if (!controlsRef.current.controlPressed) {
            handleCalculator();
          }
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();

          if (controlsRef.current.controlPressed) {
            updateSketch()
              .then(() => notify('save', 'success'))
              .catch(() => notify('save', 'error'));
            return;
          }
          handleSavedScenes();
        }
        if (e.key === 'm' || e.key === 'M') handleMountains();
      }
    },
    [
      setLinePoints,
      setAwaitingSecondClick,
      modalIsOpenRef,
      drawingRef,
      setIsDrawing,
      setIsOwnCursorActive,
      controlsRef,
      writingRef,
      moveCamera,
      setIsWriting,
      addText,
      handleCreativity,
      handleStopAll,
      handleElementsSelection,
      handleCartesianSpaceDraw,
      handleRuler,
      redo,
      notify,
      undo,
      handleFunctionsControls,
      handleSpaceClean,
      handleInfo,
      handleMarkPosition,
      handleCalculator,
      updateSketch,
      handleSavedScenes,
      handleMountains,
    ],
  );

  const handleKeyUp = useCallback((e: any) => {
    if (e.key === 'Shift') controlsRef.current.shiftPressed = false;
    if (e.key === 'Control') controlsRef.current.controlPressed = false;
  }, [controlsRef]);

  return { handleKeyDown, handleKeyUp };
};
