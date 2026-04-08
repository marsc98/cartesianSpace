import React, { useEffect, useRef, useState } from 'react';
import css from './index.module.scss';
import IconButton from '../iconButton';
import Button from '../../atoms/button';
import { useSketch } from '../../../hooks/useSketch';
import { useScene } from '../../../hooks/contexts/SceneContext';
import type * as THREE from 'three';
import type { EditingInteractorState, CameraControls } from '../../../types';

interface EditingInteractorProps {
  speedRefectorRef: React.MutableRefObject<number>;
  editingArrowsRef: React.MutableRefObject<{
    selectAxis: (axis: string) => void;
    restoreAllColors: () => void;
    updatePosition: (mesh: THREE.Mesh) => void;
    remove: () => void;
    highlightArrow?: (axis: string | null) => void;
  } | null>;
  isMobile: boolean;
  editingInteractorIsActive: boolean;
  editingInteractorRef: React.MutableRefObject<EditingInteractorState>;
  setEditingInteractorIsActive: (active: boolean) => void;
  controlsRef: React.MutableRefObject<CameraControls>;
  stopResize: () => void;
  coordinates: { x: number; y: number } | null;
  lastIntersected: React.MutableRefObject<THREE.Mesh | null>;
}

interface Point2D {
  x: number;
  y: number;
}

interface AxisSegment {
  axis: string;
  segments: Array<{ start: Point2D; end: Point2D; type: 'positive' | 'negative' }>;
}

const EditingInteractor = ({
  speedRefectorRef,
  editingArrowsRef,
  isMobile,
  editingInteractorIsActive,
  editingInteractorRef,
  setEditingInteractorIsActive,
  controlsRef,
  stopResize,
  coordinates,
  lastIntersected,
}: EditingInteractorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const axisSegments = useRef<AxisSegment[]>([]);
  const mouseStartPos = useRef<Point2D>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const [canvasRotation, setCanvasRotation] = useState({ x: 25, y: 45 });
  const [type, setType] = useState('scale');
  const windowRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isDraggingButton = useRef(false);
  const dragStartPos = useRef<Point2D>({ x: 0, y: 0 });
  const dragStartPosition = useRef({ top: 0, left: 0 });

  const { updateElementById } = useSketch();
  const { needsRenderRef } = useScene();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const axisLength = width / 2;

    const rotation = canvasRotation;

    const project3DTo2D = (x: number, y: number, z: number): Point2D => {
      const rotX = rotation.x * Math.PI / 180;
      const rotY = rotation.y * Math.PI / 180;

      const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);

      const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);

      return {
        x: centerX + x1,
        y: centerY - y2,
      };
    };

    ctx.clearRect(0, 0, width, height);

    if (type === 'scale') {
      axisSegments.current = [];
    }

    const drawAxisLine = (
      direction: [number, number, number],
      color: string,
      label: string,
      axisName: string,
      isPositive: boolean,
    ) => {
      const origin = project3DTo2D(0, 0, 0);
      const end = project3DTo2D(
        direction[0] * axisLength * (isPositive ? 1 : -1),
        direction[1] * axisLength * (isPositive ? 1 : -1),
        direction[2] * axisLength * (isPositive ? 1 : -1),
      );

      const lineId = `${axisName}_${isPositive ? 'pos' : 'neg'}`;
      const isHovered = type === 'scale' || (type === 'reposition' && hoveredAxis === lineId);
      const lineWidth = isHovered ? 4 : 2;
      const lineColor = isHovered ? (isPositive ? '#ff4444' : '#3d68cfff') : color;

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      if (type === 'scale' || type === 'reposition') {
        axisSegments.current.push({
          axis: lineId,
          segments: [
            { start: origin, end: end, type: isPositive ? 'positive' : 'negative' },
          ],
        });
      }

      const drawArrow = (from: Point2D, to: Point2D, arrowColor: string) => {
        ctx.strokeStyle = arrowColor;
        ctx.fillStyle = arrowColor;
        ctx.lineWidth = lineWidth;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        const arrowLength = isHovered ? 12 : 8;
        const arrowAngle = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(to.x - arrowLength * Math.cos(angle - arrowAngle),
          to.y - arrowLength * Math.sin(angle - arrowAngle));
        ctx.lineTo(to.x, to.y);
        ctx.lineTo(to.x - arrowLength * Math.cos(angle + arrowAngle),
          to.y - arrowLength * Math.sin(angle + arrowAngle));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      drawArrow(origin, end, lineColor);

      if (isPositive || isHovered) {
        ctx.fillStyle = isHovered ? '#fff' : '#a4a4a4ff';
        ctx.font = isHovered ? 'bold 16px Arial' : '14px Arial';
        ctx.textAlign = 'center';
        if (isPositive) {
          ctx.fillText(label, end.x + 15, end.y - 10);
        }

        ctx.fillStyle = isHovered ? '#fff' : '#a4a4a4ff';
        ctx.font = isHovered ? 'bold 14px Arial' : '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const sign = isPositive ? '+' : '-';
        const offsetX = isPositive ? 10 : -10;
        const offsetY = isPositive ? 10 : -10;
        ctx.fillText(sign, end.x + offsetX, end.y + offsetY);
      }
    };

    drawAxisLine([1, 0, 0], '#cc0000', 'X', 'x', true);
    drawAxisLine([1, 0, 0], '#0066cc', 'X', 'x', false);
    drawAxisLine([0, 1, 0], '#cc0000', 'Y', 'y', true);
    drawAxisLine([0, 1, 0], '#0066cc', 'Y', 'y', false);
    drawAxisLine([0, 0, 1], '#0066cc', 'Z', 'z', false);
    drawAxisLine([0, 0, 1], '#cc0000', 'Z', 'z', true);
  }, [hoveredAxis, canvasRotation]);

  const detectAxisHover = (mouseX: number, mouseY: number): string | null => {
    const threshold = 10;

    for (const axisData of axisSegments.current) {
      for (const segment of axisData.segments) {
        const distance = distanceToLineSegment(
          mouseX, mouseY,
          segment.start.x, segment.start.y,
          segment.end.x, segment.end.y,
        );
        if (distance <= threshold) return axisData.axis;
      }
    }
    return null;
  };

  const distanceToLineSegment = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number,
  ): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  };

  const processAxisHover = (hoveredAxisName: string | null) => {
    if (hoveredAxisName && type === 'reposition') {
      const [axisLetter, sign] = hoveredAxisName.split('_');
      const signal = sign === 'pos' ? '+' : '-';
      const axis = signal + axisLetter.toUpperCase();
      editingArrowsRef.current?.selectAxis(axis);
    }
    if (hoveredAxisName === null && type === 'reposition') {
      editingArrowsRef.current?.restoreAllColors();
    }
  };

  const processMovement = (mouseX: number, mouseY: number) => {
    const isReposition = type === 'reposition';
    const isScale = type === 'scale';

    if (isScale || isReposition) {
      const hoveredAxisName = detectAxisHover(mouseX, mouseY);
      setHoveredAxis(hoveredAxisName);
      processAxisHover(hoveredAxisName);

      if (hoveredAxisName && lastIntersected?.current?.parent?.scale) {
        const correction = isMobile ? 150 : 250;
        const deltaX = mouseX - correction;
        const deltaY = correction - mouseY;
        const axisLetter = hoveredAxisName.split('_')[0];

        switch (axisLetter) {
          case 'x': {
            const scaleX = lastIntersected.current.parent.scale.x + (deltaX * (speedRefectorRef.current * 0.0001));
            if (scaleX > 0.1) {
              if (editingArrowsRef.current) editingArrowsRef.current.updatePosition(lastIntersected.current);
              if (isReposition) {
                lastIntersected.current.parent.position.x += (deltaX * (speedRefectorRef.current * 0.0001));
              } else {
                lastIntersected.current.parent.scale.x = scaleX;
              }
              needsRenderRef.current = true;
            }
            break;
          }
          case 'y': {
            const scaleY = lastIntersected.current.parent.scale.y + (deltaY * (speedRefectorRef.current * 0.0001));
            if (scaleY > 0.1) {
              if (isReposition) {
                lastIntersected.current.parent.position.y += (deltaY * (speedRefectorRef.current * 0.0001));
                if (editingArrowsRef.current) editingArrowsRef.current.updatePosition(lastIntersected.current);
              } else {
                lastIntersected.current.parent.scale.y = scaleY;
              }
              needsRenderRef.current = true;
            }
            break;
          }
          case 'z': {
            const scaleZ = lastIntersected.current.parent.scale.z - (deltaX * (speedRefectorRef.current * 0.0001));
            if (scaleZ > 0.1) {
              if (isReposition) {
                lastIntersected.current.parent.position.z -= (deltaX * (speedRefectorRef.current * 0.0001));
                if (editingArrowsRef.current) editingArrowsRef.current.updatePosition(lastIntersected.current);
              } else {
                lastIntersected.current.parent.scale.z = scaleZ;
              }
              needsRenderRef.current = true;
            }
            break;
          }
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;
    processMovement(mouseX, mouseY);

    if (type === 'rotation' && isDragging.current) {
      const deltaX = mouseX - mouseStartPos.current.x;
      const deltaY = mouseY - mouseStartPos.current.y;

      setCanvasRotation(prev => ({
        x: prev.x + (deltaY * 0.5),
        y: prev.y + (deltaX * 0.5),
      }));

      if (lastIntersected?.current?.parent?.rotation) {
        lastIntersected.current.parent.rotation.y += deltaX * 0.01;
        lastIntersected.current.parent.rotation.x += deltaY * 0.01;
        needsRenderRef.current = true;
      }

      mouseStartPos.current = { x: mouseX, y: mouseY };
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (type === 'rotation') {
      isDragging.current = true;
      mouseStartPos.current = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      };
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    controlsRef.current.mouseDown = false;
    if (type === 'rotation') {
      isDragging.current = false;
    }

    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;
    const hoveredAxisName = detectAxisHover(mouseX, mouseY);
    setHoveredAxis(hoveredAxisName);
    processMovement(mouseX, mouseY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (type === 'rotation' && e.touches.length === 1) {
      isDragging.current = true;
      const touch = e.touches[0];
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      mouseStartPos.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      processMovement(touchX, touchY);

      if (type === 'rotation' && isDragging.current) {
        const deltaX = touchX - mouseStartPos.current.x;
        const deltaY = touchY - mouseStartPos.current.y;

        setCanvasRotation(prev => ({
          x: prev.x + (deltaY * 0.5),
          y: prev.y + (deltaX * 0.5),
        }));

        if (lastIntersected?.current?.parent?.rotation) {
          lastIntersected.current.parent.rotation.y += deltaX * 0.01;
          lastIntersected.current.parent.rotation.x += deltaY * 0.01;
          needsRenderRef.current = true;
        }

        mouseStartPos.current = { x: touchX, y: touchY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (type === 'rotation') {
      isDragging.current = false;
    }
    // TouchEvent doesn't have offsetX/offsetY — clear hover state on touch end
    setHoveredAxis(null);
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
    if (isDraggingButton.current) {
      e.preventDefault();
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      setPosition({
        top: dragStartPosition.current.top + deltaY,
        left: dragStartPosition.current.left + deltaX,
      });
    }
  };

  const handleGlobalMouseUp = () => {
    if (isDraggingButton.current) {
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
    if (isDraggingButton.current && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartPos.current.x;
      const deltaY = touch.clientY - dragStartPos.current.y;

      setPosition({
        top: dragStartPosition.current.top + deltaY,
        left: dragStartPosition.current.left + deltaX,
      });
    }
  };

  const handleGlobalTouchEnd = () => {
    if (isDraggingButton.current) {
      isDraggingButton.current = false;
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    }
  };

  useEffect(() => {
    setType(editingInteractorRef.current.type);
  }, [editingInteractorIsActive]);

  useEffect(() => {
    controlsRef.current.mouseDown = false;

    return () => {
      if (lastIntersected.current?.parent) {
        const particleId = lastIntersected.current.parent.userData.particleId as string;
        const updatedElement = {
          position: {
            x: lastIntersected.current.parent.position.x,
            y: lastIntersected.current.parent.position.y,
            z: lastIntersected.current.parent.position.z,
          },
          rotation: {
            x: lastIntersected.current.parent.rotation.x,
            y: lastIntersected.current.parent.rotation.y,
            z: lastIntersected.current.parent.rotation.z,
          },
          size: {
            x: lastIntersected.current.parent.scale.x,
            y: lastIntersected.current.parent.scale.y,
            z: lastIntersected.current.parent.scale.z,
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updateElementById as any)(particleId, updatedElement);
      }

      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  return (
    <div
      ref={windowRef}
      className={css['coordinate-system']}
      style={{
        top: `${(coordinates?.y ?? 0) + position.top}px`,
        left: `${(coordinates?.x ?? 0) + position.left}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <IconButton
        className={css['move']}
        iconName="move"
        hoverText="Mover janela"
        onMouseDown={handleButtonMouseDown}
        onTouchStart={handleButtonTouchStart}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10000000000000,
          cursor: isDraggingButton.current ? 'grabbing' : 'grab',
          opacity: isDraggingButton.current ? 1 : 0.6,
          userSelect: 'none',
          touchAction: 'none',
        }}
      />

      <div className={css['coordinate-system__canvas-container']}>
        <canvas
          ref={canvasRef}
          width={isMobile ? 300 : 500}
          height={isMobile ? 300 : 500}
          className={css['coordinate-system__canvas']}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: type === 'rotation' ? (isDragging.current ? 'grabbing' : 'grab') : (hoveredAxis ? 'pointer' : 'default'),
            touchAction: type === 'rotation' ? 'none' : 'auto',
          }}
        />
      </div>

      <div className={css['bottom-container']}>
        <div className={css['coordinate-system__legend']}>
          <p className={`${css['coordinate-system__legend-item']} ${css['coordinate-system__legend-item--positive']}`}>
            Parte positiva do eixo
          </p>
          <p className={`${css['coordinate-system__legend-item']} ${css['coordinate-system__legend-item--negative']}`}>
            Parte negativa do eixo
          </p>
        </div>

        <Button
          text="Fechar"
          action={() => {
            setEditingInteractorIsActive(false);
            if (type === 'reposition') editingArrowsRef.current?.remove();
            if (editingArrowsRef.current?.highlightArrow) {
              editingArrowsRef.current.highlightArrow(null);
            }
          }}
          type="button"
          color="red"
          className={css['coordinate-system__legend-button']}
        />
      </div>
    </div>
  );
};

export default EditingInteractor;
