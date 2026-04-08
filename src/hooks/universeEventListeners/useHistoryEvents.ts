import { useCallback } from 'react';
import {
  disposeMultipleObjects,
  createTraceAlongPath,
} from '../../components/organisms/Board3d/spaceElements';

export const useHistoryEvents = ({
  historyRef,
  setHistorySize,
  elements,
  sceneRef,
  elementsStackRef,
  deleteElementsById,
  notify,
  particleRef,
  addElement,
  cartesianSpaceRef,
  handleCreativityOnSpace,
  needsRenderRef,
  setEditingInteractorIsActive,
}: any) => {
  const MAX_HISTORY = 7;

  const pushHistory = useCallback(
    (command: any) => {
      const { past } = historyRef.current;
      if (past.length >= MAX_HISTORY) {
        past.shift();
      }
      past.push(command);
      historyRef.current.future = [];
      setHistorySize({ past: historyRef.current.past.length, future: 0 });
    },
    [historyRef, setHistorySize],
  );

  const deleteElement = useCallback(
    (particleId: any) => {
      const matching = elements.filter((el: any) => el.id === particleId);
      if (matching.length === 0) return;

      const isTrace = matching[0].type === 'traces';
      const command = isTrace
        ? {
          type: 'REMOVE_ELEMENT',
          element: { id: particleId, type: 'traces', segments: matching },
        }
        : { type: 'REMOVE_ELEMENT', element: matching[0] };

      pushHistory(command);
      disposeMultipleObjects(sceneRef, elementsStackRef, particleId);
      deleteElementsById(particleId);
      setEditingInteractorIsActive?.(false);
      needsRenderRef.current = true;
      notify('delete', 'warning', { duration: 1200, style: 'ghost' });
    },
    [elements, pushHistory, sceneRef, elementsStackRef, deleteElementsById, notify, needsRenderRef, setEditingInteractorIsActive],
  );

  const replayTrace = useCallback(
    (traceCommand: any) => {
      const { id, segments } = traceCommand.element;

      particleRef.current = { id, group: null };

      const sceneLengthStart = sceneRef.current.children.length;

      let traceGroup = null;
      segments.forEach((segment: any) => {
        traceGroup = createTraceAlongPath(
          segment,
          particleRef,
          addElement,
          true,
        );
        addElement(segment);
      });

      if (traceGroup) {
        sceneRef.current.add(traceGroup);
      }

      const sceneLengthEnd = sceneRef.current.children.length;
      elementsStackRef.current.set(id, { sceneLengthStart, sceneLengthEnd });
    },
    [sceneRef, elementsStackRef, particleRef, addElement],
  );

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;


    if (past.length === 0) return;

    const command = past.pop();
    const { id, type } = command.element;


    if (command.type === 'ADD_ELEMENT') {
      disposeMultipleObjects(sceneRef, elementsStackRef, id);
      deleteElementsById(id);
    } else if (command.type === 'REMOVE_ELEMENT') {
      if (type === 'traces') {
        replayTrace(command);
      } else {
        handleCreativityOnSpace(
          command.element,
          sceneRef,
          elementsStackRef,
          cartesianSpaceRef,
          addElement,
          true,
          null,
        );
        addElement(command.element);
      }
    }


    future.push(command);
    setEditingInteractorIsActive?.(false);
    needsRenderRef.current = true;
    setHistorySize({ past: historyRef.current.past.length, future: historyRef.current.future.length });
  }, [
    historyRef,
    sceneRef,
    elementsStackRef,
    cartesianSpaceRef,
    addElement,
    deleteElementsById,
    replayTrace,
    setHistorySize,
    handleCreativityOnSpace,
    needsRenderRef,
    setEditingInteractorIsActive,
  ]);

  const redo = useCallback(() => {
    
    const { past, future } = historyRef.current;
    if (future.length === 0) return;

    const command = future.pop();
    const { id, type } = command.element;

    if (command.type === 'ADD_ELEMENT') {
      if (type === 'traces') {
        replayTrace(command);
      } else {
        handleCreativityOnSpace(
          command.element,
          sceneRef,
          elementsStackRef,
          cartesianSpaceRef,
          addElement,
          true,
          null,
        );
        addElement(command.element);
      }
    } else if (command.type === 'REMOVE_ELEMENT') {
      disposeMultipleObjects(sceneRef, elementsStackRef, id);
      deleteElementsById(id);
    }

    past.push(command);
    needsRenderRef.current = true;
    setHistorySize({ past: historyRef.current.past.length, future: historyRef.current.future.length });
  }, [
    historyRef,
    sceneRef,
    elementsStackRef,
    cartesianSpaceRef,
    addElement,
    deleteElementsById,
    replayTrace,
    setHistorySize,
    handleCreativityOnSpace,
    needsRenderRef,
  ]);

  return { pushHistory, deleteElement, replayTrace, undo, redo };
};
