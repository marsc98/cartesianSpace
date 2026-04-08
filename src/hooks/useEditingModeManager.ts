import { useRef, useState, useCallback, useEffect } from 'react';
import type { EditingMode, EditingModeId, EditingModeContext } from '../types/editing';

export function useEditingModeManager(builtInModes: EditingMode[] = []) {
  const modesRef = useRef<Map<EditingModeId, EditingMode>>(new Map());
  const activeModeIdRef = useRef<EditingModeId | null>(null);
  const activeContextRef = useRef<EditingModeContext | null>(null);
  const [activeMode, setActiveMode] = useState<EditingModeId | null>(null);

  useEffect(() => {
    builtInModes.forEach((mode) => modesRef.current.set(mode.id, mode));
  }, [builtInModes]); // added dependency

  const activate = useCallback((modeId: EditingModeId, context: EditingModeContext) => {
    if (activeModeIdRef.current) {
      modesRef.current.get(activeModeIdRef.current)?.exit(activeContextRef.current!);
    }
    activeModeIdRef.current = modeId;
    activeContextRef.current = context;
    setActiveMode(modeId);
    modesRef.current.get(modeId)?.enter(context);
  }, []);

  const deactivate = useCallback(() => {
    if (!activeModeIdRef.current) return;
    modesRef.current.get(activeModeIdRef.current)?.exit(activeContextRef.current!);
    activeModeIdRef.current = null;
    activeContextRef.current = null;
    setActiveMode(null);
  }, []);

  const dispatch = useCallback((event: any) => {
    if (!activeModeIdRef.current) return;
    modesRef.current.get(activeModeIdRef.current)?.update(event, activeContextRef.current!);
  }, []);

  const register = useCallback((mode: EditingMode) => {
    modesRef.current.set(mode.id, mode);
  }, []);

  return { activate, deactivate, dispatch, register, activeMode };
}
