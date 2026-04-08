import { useCallback } from 'react';
import type { UniverseContext } from '../../types/universe';

export const useCameraEvents = (
  ctx: UniverseContext,
  { controlsRef }: any
) => {
  const { moveCamera, rotateCamera } = ctx;

  const handleWheel = useCallback(
    (e: any) => {
      const controls = controlsRef.current;
      if (e.deltaY !== 0 && !e.shiftKey && e.deltaX === 0) {
        if (controls.controlPressed) {
          if (e.deltaY > 0) moveCamera('down');
          else moveCamera('up', 1);
        } else {
          if (e.deltaY > 0) moveCamera('backward', 1);
          else moveCamera('forward', 1);
        }
      }
      if (e.deltaX !== 0 || (e.shiftKey && e.deltaY !== 0)) {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        if (delta > 0) moveCamera('right', 0.5);
        else moveCamera('left', 0.5);
      }
      e.preventDefault();
    },
    [moveCamera, controlsRef],
  );

  const handleCameraDrag = useCallback((deltaX: number, deltaY: number) => {
    const controls = controlsRef.current;
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      controls.mouseMoving = true;
    }
    if (controls.shiftPressed) {
      if (deltaX > 0) moveCamera('left', Math.abs(deltaX) * 0.05);
      else if (deltaX < 0) moveCamera('right', Math.abs(deltaX) * 0.05);
      if (deltaY > 0) moveCamera('up', Math.abs(deltaY) * 0.05);
      else if (deltaY < 0) moveCamera('down', Math.abs(deltaY) * 0.05);
    } else {
      rotateCamera(deltaX, deltaY);
    }
  }, [moveCamera, rotateCamera, controlsRef]);

  return { handleWheel, handleCameraDrag };
};
