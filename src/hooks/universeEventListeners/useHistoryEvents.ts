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
  updateMultipleElements,
  updateElementById,
  updateGroupsOnly,
  sketchGroupsRef,
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

    if (command.type === 'GROUP_ELEMENTS') {
      // Undo: restore elements to pre-group snapshot (no groupId), remove group
      updateMultipleElements?.(command.snapshot);
      const currentGroups = sketchGroupsRef?.current ?? [];
      updateGroupsOnly?.(currentGroups.filter((g: any) => g.id !== command.group.id));
    } else if (command.type === 'UNGROUP_ALL') {
      // Undo: re-apply groupId to all members, re-add group
      const memberUpdates = command.group.memberIds.map((id: string) => ({
        id,
        groupId: command.group.id,
      }));
      updateMultipleElements?.(memberUpdates);
      const currentGroups = sketchGroupsRef?.current ?? [];
      updateGroupsOnly?.([...currentGroups, command.group]);
    } else if (command.type === 'UNGROUP_SINGLE') {
      // Undo: re-apply groupId to this element
      updateElementById?.(command.elementId, { groupId: command.groupId });
    } else if (command.type === 'REMOVE_GROUP') {
      // Undo: restore all elements to scene and IndexedDB
      command.elements.forEach((el: any) => {
        handleCreativityOnSpace(
          el,
          sceneRef,
          elementsStackRef,
          cartesianSpaceRef,
          addElement,
          true,
          null,
        );
        addElement(el);
      });
      if (command.group) {
        const currentGroups = sketchGroupsRef?.current ?? [];
        updateGroupsOnly?.([...currentGroups, command.group]);
      }
    } else {
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
    updateMultipleElements,
    updateElementById,
    updateGroupsOnly,
    sketchGroupsRef,
  ]);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;

    const command = future.pop();

    if (command.type === 'GROUP_ELEMENTS') {
      // Redo: re-apply groupId to all members, re-add group
      const memberUpdates = command.group.memberIds.map((id: string) => ({
        id,
        groupId: command.group.id,
      }));
      updateMultipleElements?.(memberUpdates);
      const currentGroups = sketchGroupsRef?.current ?? [];
      updateGroupsOnly?.([...currentGroups, command.group]);
    } else if (command.type === 'UNGROUP_ALL') {
      // Redo: remove groupId from all members, remove group
      updateMultipleElements?.(command.snapshot);
      const currentGroups = sketchGroupsRef?.current ?? [];
      updateGroupsOnly?.(currentGroups.filter((g: any) => g.id !== command.group.id));
    } else if (command.type === 'UNGROUP_SINGLE') {
      // Redo: remove groupId from this element
      updateElementById?.(command.elementId, { groupId: undefined });
    } else if (command.type === 'REMOVE_GROUP') {
      // Redo: delete all elements from scene and IndexedDB
      command.elements.forEach((el: any) => {
        disposeMultipleObjects(sceneRef, elementsStackRef, el.id);
      });
      deleteElementsById(command.elements.map((el: any) => el.id));
      if (command.group) {
        const currentGroups = sketchGroupsRef?.current ?? [];
        updateGroupsOnly?.(currentGroups.filter((g: any) => g.id !== command.group.id));
      }
    } else {
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
    updateMultipleElements,
    updateElementById,
    updateGroupsOnly,
    sketchGroupsRef,
  ]);

  return { pushHistory, deleteElement, replayTrace, undo, redo };
};
