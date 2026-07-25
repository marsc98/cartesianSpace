import React, { useEffect, useRef, useState } from 'react';
import css from './index.module.scss';
import Button from '../../atoms/button';
import { useSketch } from '../../../hooks/useSketch';
import { useScene } from '../../../hooks/contexts/SceneContext';
import * as THREE from 'three';
import type { EditingInteractorState, CameraControls } from '../../../types';
import RangeInput from '../../atoms/rangeInput';

interface EditingInteractorProps {
  editingArrowsRef: React.MutableRefObject<{
    selectAxis: (axis: string) => void;
    restoreAllColors: () => void;
    updatePosition: (mesh: THREE.Mesh) => void;
    remove: () => void;
    highlightArrow?: (axis: string | null) => void;
  } | null>;
  editingInteractorIsActive: boolean;
  editingInteractorRef: React.MutableRefObject<EditingInteractorState>;
  controlsRef: React.MutableRefObject<CameraControls>;
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
  editingArrowsRef,
  editingInteractorIsActive,
  editingInteractorRef,
  controlsRef,
  lastIntersected,
}: EditingInteractorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const [selectedAxes, setSelectedAxes] = useState<Set<'x' | 'y' | 'z'>>(new Set(['x', 'y', 'z']));
  const [selectedDirections, setSelectedDirections] = useState<Set<string>>(
    new Set(['x_pos', 'x_neg', 'y_pos', 'y_neg', 'z_pos', 'z_neg']),
  );
  const axisSegments = useRef<AxisSegment[]>([]);
  const mouseStartPos = useRef<Point2D>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const [canvasRotation, setCanvasRotation] = useState({ x: 25, y: 45 });
  const [type, setType] = useState('scale');

  const [sensitivity, setSensitivity] = useState(0.1);
  const sensitivityRef = useRef(0.1);

  const [scaleValues, setScaleValues] = useState({ x: 1, y: 1, z: 1 });

  const readWorldSize = () => {
    const mesh = lastIntersected.current;
    if (!mesh?.parent) return null;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox!;
    const s = mesh.parent.scale;
    return {
      x: (bb.max.x - bb.min.x) * s.x,
      y: (bb.max.y - bb.min.y) * s.y,
      z: (bb.max.z - bb.min.z) * s.z,
    };
  };

  const { updateElementById } = useSketch();
  const { needsRenderRef, sceneRef } = useScene();

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

    if (type === 'scale' || type === 'reposition') {
      axisSegments.current = [];
    }

    const getIsSelected = (axisName: string, isPositive: boolean): boolean => {
      if (type === 'reposition') {
        return selectedDirections.has(`${axisName}_${isPositive ? 'pos' : 'neg'}`);
      }
      return selectedAxes.has(axisName as 'x' | 'y' | 'z');
    };

    const drawAxisLine = (
      direction: [number, number, number],
      color: string,
      label: string,
      axisName: string,
      isPositive: boolean,
      isSelected: boolean,
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
      ctx.globalAlpha = isSelected ? 1 : 0.3;
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
      ctx.globalAlpha = 1;
    };

    drawAxisLine([1, 0, 0], '#cc0000', 'X', 'x', true,  getIsSelected('x', true));
    drawAxisLine([1, 0, 0], '#0066cc', 'X', 'x', false, getIsSelected('x', false));
    drawAxisLine([0, 1, 0], '#cc0000', 'Y', 'y', true,  getIsSelected('y', true));
    drawAxisLine([0, 1, 0], '#0066cc', 'Y', 'y', false, getIsSelected('y', false));
    drawAxisLine([0, 0, 1], '#0066cc', 'Z', 'z', false, getIsSelected('z', false));
    drawAxisLine([0, 0, 1], '#cc0000', 'Z', 'z', true,  getIsSelected('z', true));
  }, [hoveredAxis, canvasRotation, selectedAxes, selectedDirections, type]);

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
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (type !== 'scale' && type !== 'reposition') return;
    const axis = detectAxisHover(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    if (!axis) return;
    if (type === 'reposition') {
      setSelectedDirections((prev: Set<string>) => {
        const next = new Set(prev);
        next.has(axis) ? next.delete(axis) : next.add(axis);
        return next;
      });
    } else {
      const letter = axis.split('_')[0] as 'x' | 'y' | 'z';
      setSelectedAxes((prev: Set<'x' | 'y' | 'z'>) => {
        const next = new Set(prev);
        next.has(letter) ? next.delete(letter) : next.add(letter);
        return next;
      });
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

        const targetIds = editingInteractorRef.current.targetIds;
        if (targetIds && targetIds.length > 1 && sceneRef?.current) {
          for (const id of targetIds.slice(1)) {
            const obj = sceneRef.current.children.find((c: any) => c.userData?.particleId === id) as any;
            if (obj) {
              obj.rotation.y += deltaX * 0.01;
              obj.rotation.x += deltaY * 0.01;
            }
          }
        }
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

          const targetIds = editingInteractorRef.current.targetIds;
          if (targetIds && targetIds.length > 1 && sceneRef?.current) {
            for (const id of targetIds.slice(1)) {
              const obj = sceneRef.current.children.find((c: any) => c.userData?.particleId === id) as any;
              if (obj) {
                obj.rotation.y += deltaX * 0.01;
                obj.rotation.x += deltaY * 0.01;
              }
            }
          }
        }

        mouseStartPos.current = { x: touchX, y: touchY };
      }
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLCanvasElement>) => {
    if (type === 'rotation') {
      isDragging.current = false;
    }
    setHoveredAxis(null);
  };

  const applyStep = (dir: 1 | -1) => {
    if (!lastIntersected?.current?.parent) return;
    const parent = lastIntersected.current.parent;
    const stepValue = sensitivityRef.current;
    if (type === 'scale') {
      for (const axis of selectedAxes) {
        const next = parent.scale[axis] + dir * stepValue;
        if (next > 0.1) parent.scale[axis] = next;
      }
      const ws = readWorldSize();
      if (ws) setScaleValues(ws);
    } else if (type === 'reposition') {
      for (const dirKey of selectedDirections) {
        const [ax, sign] = dirKey.split('_');
        const multiplier = (sign === 'pos' ? 1 : -1) * dir;
        parent.position[ax as 'x' | 'y' | 'z'] += multiplier * stepValue;
      }
      editingArrowsRef.current?.updatePosition(lastIntersected.current);
    }

    const targetIds = editingInteractorRef.current.targetIds;
    if (targetIds && targetIds.length > 1 && sceneRef?.current) {
      for (const id of targetIds.slice(1)) {
        const obj = sceneRef.current.children.find((c: any) => c.userData?.particleId === id) as any;
        if (!obj) continue;
        if (type === 'scale') {
          for (const axis of selectedAxes) {
            const next = obj.scale[axis] + dir * stepValue;
            if (next > 0.1) obj.scale[axis] = next;
          }
        } else if (type === 'reposition') {
          for (const dirKey of selectedDirections) {
            const [ax, sign] = dirKey.split('_');
            const multiplier = (sign === 'pos' ? 1 : -1) * dir;
            obj.position[ax as 'x' | 'y' | 'z'] += multiplier * stepValue;
          }
        }
      }
    }

    needsRenderRef.current = true;
  };

  const getDisplacementLabel = (axis: 'x' | 'y' | 'z'): string => {
    const hasPos = selectedDirections.has(`${axis}_pos`);
    const hasNeg = selectedDirections.has(`${axis}_neg`);
    const step = sensitivity.toFixed(2);
    if (hasPos && hasNeg) return `±${step}`;
    if (hasPos) return `+${step}`;
    if (hasNeg) return `−${step}`;
    return '0';
  };

  useEffect(() => {
    setType(editingInteractorRef.current.type);
    setSelectedAxes(new Set(['x', 'y', 'z']));
    setSelectedDirections(new Set(['x_pos', 'x_neg', 'y_pos', 'y_neg', 'z_pos', 'z_neg']));
    const ws = readWorldSize();
    if (ws) setScaleValues(ws);
  }, [editingInteractorIsActive]);

  useEffect(() => {
    controlsRef.current.mouseDown = false;

    return () => {
      const saveObjectState = (obj: THREE.Object3D, id: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updateElementById as any)(id, {
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          size: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        });
      };

      if (lastIntersected.current?.parent) {
        const primaryId = lastIntersected.current.parent.userData.particleId as string;
        saveObjectState(lastIntersected.current.parent, primaryId);

        const targetIds = editingInteractorRef.current.targetIds;
        if (targetIds && targetIds.length > 1 && sceneRef?.current) {
          for (const id of targetIds.slice(1)) {
            const obj = sceneRef.current.children.find((c: any) => c.userData?.particleId === id);
            if (obj) saveObjectState(obj, id);
          }
        }
      }
    };
  }, []);

  const toggleAxis = (axis: 'x' | 'y' | 'z') => {
    setSelectedAxes((prev: Set<'x' | 'y' | 'z'>) => {
      const next = new Set(prev);
      next.has(axis) ? next.delete(axis) : next.add(axis);
      return next;
    });
  };

  const toggleDirection = (key: string) => {
    setSelectedDirections((prev: Set<string>) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className={css['coordinate-system']}>
      <div className={css['coordinate-system__canvas-container']}>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className={css['coordinate-system__canvas']}
          onClick={handleCanvasClick}
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
        {type === 'scale' && (
          <>
            <div className={css['values-display']}>
              {(['x', 'y', 'z'] as const).map(axis => (
                <span key={axis} className={css['value-item']} data-axis={axis}>
                  {axis.toUpperCase()}: {scaleValues[axis].toFixed(2)}
                </span>
              ))}
            </div>
            <div className={css['axis-toggles']}>
              {(['x', 'y', 'z'] as const).map(axis => (
                <button
                  key={axis}
                  className={css['axis-toggle']}
                  data-axis={axis}
                  data-active={selectedAxes.has(axis)}
                  onClick={() => toggleAxis(axis)}
                >
                  {axis.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        )}

        {type === 'reposition' && (
          <>
            <div className={css['values-display']}>
              {(['x', 'y', 'z'] as const).map(axis => (
                <span key={axis} className={css['value-item']} data-axis={axis}>
                  {axis.toUpperCase()}: {getDisplacementLabel(axis)}
                </span>
              ))}
            </div>
            <div className={css['direction-grid']}>
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis} className={css['direction-pair']}>
                  {(['pos', 'neg'] as const).map(sign => {
                    const key = `${axis}_${sign}`;
                    return (
                      <button
                        key={key}
                        className={css['direction-btn']}
                        data-axis={axis}
                        data-active={selectedDirections.has(key)}
                        onClick={() => toggleDirection(key)}
                      >
                        {axis}{sign === 'pos' ? '+' : '−'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {(type === 'scale' || type === 'reposition') && (
          <div className={css['range-controls-section']}>
            <RangeInput
              sizeRef={sensitivityRef as React.MutableRefObject<number>}
              min={0.1}
              max={5}
              label="Passo"
              onValueChange={v => { sensitivityRef.current = v; setSensitivity(v); }}
              thumbIcon={type === 'scale' ? '/images/icons/aspect_ratio.svg' : '/images/icons/straighten.svg'}
            />
          </div>
        )}

        {(type === 'scale' || type === 'reposition') && (
          <div className={css['step-buttons']}>
            <Button
              text="−"
              action={() => applyStep(-1)}
              type="button"
              color="orange"
            />
            <Button
              text="+"
              action={() => applyStep(1)}
              type="button"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditingInteractor;
