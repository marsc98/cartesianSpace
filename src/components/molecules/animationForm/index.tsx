import React, { useState, useEffect, useRef } from 'react';
import css from './index.module.scss';
import Button from '../../atoms/button';
import { useFunctionsRefs } from '../../../hooks/contexts/FunctionsContext';
import IconButton from '../iconButton';
import { useModal } from '../../../hooks/useModal';
import { evaluate as mathEvaluate } from 'mathjs';
import Calculator from '../calculator';
import type * as THREE from 'three';
import type { EditingInteractorState } from '../../../types';

interface AnimationFormProps {
  lastIntersected: React.MutableRefObject<THREE.Mesh | null>;
  editingInteractorRef?: React.MutableRefObject<EditingInteractorState>;
  sceneRef?: React.MutableRefObject<THREE.Scene>;
}

interface AxisEquations {
  x: string;
  y: string;
  z: string;
}

interface PredefinedMovement {
  name: string;
  label: string;
  fullName: string;
  equation: [string, string, string];
  color: string;
  description: string;
}

const safeEvaluate = (expr: string, scope: Record<string, number>): number | null => {
  try {
    const result = mathEvaluate(expr, scope);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
};

export default function AnimationForm({ lastIntersected, editingInteractorRef, sceneRef }: AnimationFormProps) {
  const [velocity, setVelocity] = useState(5);
  const [distance, setDistance] = useState(15);
  const [activeMovement, setActiveMovement] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState(false);
  const [currentEquation, setCurrentEquation] = useState('');
  const animationRef = useRef<number | null>(null);
  const [objectPosition, setObjectPosition] = useState({ x: 0, y: 0 });
  const [selectedAxis, setSelectedAxis] = useState('x');
  const [variablesByAxis, setVariablesByAxis] = useState<string[]>([]);

  const { addModal, removeModal } = useModal();

  const [variablesStack, setVariablesStack] = useState<string[][]>([[], [], []]);

  const [axisEquations, setAxisEquations] = useState<AxisEquations>({
    x: '',
    y: '',
    z: '',
  });

  const { textRef, writingRef } = useFunctionsRefs();

  const predefinedMovements: PredefinedMovement[] = [
    {
      name: 'MRU',
      label: 'MRU',
      fullName: 'Movimento Retilíneo Uniforme',
      equation: ['S0 + v*t', '0', '0'],
      color: 'green',
      description: 'Velocidade constante',
    },
    {
      name: 'MRUV',
      label: 'MRUV',
      fullName: 'Movimento Uniformemente Variado',
      equation: ['S0 + v0*t + (a*t^2)/2', '0', '0'],
      color: 'purple',
      description: 'Aceleração constante',
    },
    {
      name: 'Queda Livre',
      label: 'Queda Livre',
      fullName: 'Queda Livre',
      equation: ['h0 - (g*t^2)/2', '0', '0'],
      color: 'blue',
      description: 'Aceleração gravitacional',
    },
    {
      name: 'Movimento circular',
      label: 'Mov. Circular',
      fullName: 'Movimento Circular',
      equation: ['5*sin(30*t)', '0', '5*cos(30*t)'],
      color: 'orange',
      description: 'Velocidade inicial vertical',
    },
  ];

  const startMovement = async () => {
    await handleElementAnimation();
  };

  async function handleElementAnimation() {
    if (!lastIntersected.current) {
      setError(true);
      setResult('Nenhum elemento selecionado');
      return;
    }

    const startTime = Date.now();
    const totalDuration = (distance / velocity) * 1000;
    const steps = Math.ceil(distance);

    let currentStep = 0;

    const elapsed = Date.now() - startTime;
    const t = elapsed / 1000;

    const scope: Record<string, number> = {
      S0: 0,
      h0: selectedAxis === 'y' ? lastIntersected.current.position.y : 0,
      v0: velocity,
      v: velocity,
      a: 2,
      t,
      g: 9.80665,
    };

    let expressionX = String(axisEquations.x || '0').trim() || '0';
    let expressionY = String(axisEquations.y || '0').trim() || '0';
    let expressionZ = String(axisEquations.z || '0').trim() || '0';

    const MATH_SAFE_PATTERN = /^[0-9xyzt\s\+\-\*\/\^\(\)\.\,sincotgalbeqrtpifSvahg]+$/i;

    const expressions = [expressionX, expressionY, expressionZ];
    for (const expr of expressions) {
      if (expr !== '0' && (!MATH_SAFE_PATTERN.test(expr) || expr.length > 200)) {
        setError(true);
        setResult('Expressão contém caracteres inválidos');
        return;
      }
    }

    let cancelled = false;

    for (let i = 0; i < distance && !cancelled; i++) {
      const stepScope = { ...scope, t: i };
      const resX = safeEvaluate(expressionX, stepScope) ?? 0;
      const resY = safeEvaluate(expressionY, stepScope) ?? 0;
      const resZ = safeEvaluate(expressionZ, stepScope) ?? 0;

      if (lastIntersected.current?.parent) {
        lastIntersected.current.parent.position.x += resX;
        lastIntersected.current.parent.position.y += resY;
        lastIntersected.current.parent.position.z += resZ;

        const targetIds = editingInteractorRef?.current?.targetIds;
        if (targetIds && targetIds.length > 1 && sceneRef?.current) {
          for (const id of targetIds.slice(1)) {
            const obj = sceneRef.current.children.find((c: any) => c.userData?.particleId === id) as any;
            if (obj) {
              obj.position.x += resX;
              obj.position.y += resY;
              obj.position.z += resZ;
            }
          }
        }
      }

      const delay = Math.max(10, 1000 / velocity);
      await new Promise<void>((resolve) => {
        const timeoutId = setTimeout(resolve, delay);
        animationRef.current = timeoutId as unknown as number;
      });
    }
  }

  const stopMovement = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    setActiveMovement(null);
    setObjectPosition({ x: 0, y: 0 });
    setResult('');
    setCurrentEquation('');
  };

  const openCalculator = (axle: 'x' | 'y' | 'z') => {
    const id = `modal-calculator-${Date.now()}`;

    addModal({
      id,
      isOpen: true,
      title: 'Cálculadora',
      content: (
        <Calculator
          textRef={textRef}
          axle={axle}
          setAxisEquations={setAxisEquations}
          writingRef={writingRef}
        />
      ),
      onClose: () => removeModal(id),
      buttonText: '',
      formId: 'calculator-form',
      buttonColor: 'blue',
      action: () => removeModal(id),
    });
  };

  useEffect(() => {
    if (!writingRef?.current) {
      writingRef.current = true;
    }
    return () => {
      writingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const equationsArray = Object.values(axisEquations);
    if (equationsArray.length === 0) return;

    setVariablesStack((prevStack) => {
      const newStack = prevStack.map((vars) => new Set(vars));
      const letterRegex = /^[a-zA-Z]$/;

      equationsArray.forEach((equation, index) => {
        if (!equation || equation.length === 0) return;

        const lastChar = equation[equation.length - 1];
        if (letterRegex.test(lastChar)) {
          if (!newStack[index]) {
            newStack[index] = new Set();
          }
          newStack[index].add(lastChar);
        }
      });

      return newStack.map((set) => Array.from(set));
    });
  }, [axisEquations]);

  return (
    <div className={css['physics-calculator-container']}>
      <div className={css['calculator-card']}>
        <div className={css['display-frame']}>
          <span className={css['display-label']}>X</span>
          <span className={css['display-label']}>=</span>
          <div className={css['display-screen']}>
            <input
              type="text"
              className={css['display-input']}
              value={axisEquations.x}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAxisEquations((prev) => ({ ...prev, x: e.target.value }));
              }}
            />
          </div>
          <IconButton
            iconName="calculator"
            hoverText="Cálculadora"
            onClick={() => openCalculator('x')}
          />
        </div>

        <div className={css['display-frame']}>
          <span className={css['display-label']}>Y</span>
          <span className={css['display-label']}>=</span>
          <div className={css['display-screen']}>
            <input
              type="text"
              className={css['display-input']}
              value={axisEquations.y}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAxisEquations((prev) => ({ ...prev, y: e.target.value }));
              }}
            />
          </div>
          <IconButton
            iconName="calculator"
            hoverText="Cálculadora"
            onClick={() => openCalculator('y')}
          />
        </div>

        <div className={css['display-frame']}>
          <span className={css['display-label']}>Z</span>
          <span className={css['display-label']}>=</span>
          <div className={css['display-screen']}>
            <input
              type="text"
              className={css['display-input']}
              value={axisEquations.z}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAxisEquations((prev) => ({ ...prev, z: e.target.value }));
              }}
            />
          </div>
          <IconButton
            iconName="calculator"
            hoverText="Cálculadora"
            onClick={() => openCalculator('z')}
          />
        </div>

        <div className={css['controls-section']}>
          <div className={css['movements-grid']}>
            {predefinedMovements.map((movement) => (
              <Button
                key={movement.name}
                action={() =>
                  setAxisEquations({
                    x: movement.equation[0],
                    y: movement.equation[1],
                    z: movement.equation[2],
                  })
                }
                color={movement.color}
                text={movement.label}
                className={activeMovement === movement.name ? css['btn-active'] : ''}
              />
            ))}
          </div>

          <div className={css['control-group']}>
            <label className={css['control-label']}>
              Velocidade:{' '}
              <span className={css['control-value']}>{velocity} m/s</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={velocity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVelocity(Number(e.target.value))}
              className={css['range-input']}
              disabled={activeMovement !== null}
            />
          </div>

          <div className={css['control-group']}>
            <label className={css['control-label']}>
              Tempo: <span className={css['control-value']}>{distance} ms</span>
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={distance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistance(Number(e.target.value))}
              className={css['range-input']}
              disabled={activeMovement !== null}
            />
          </div>
        </div>

        <Button text="Animar" action={startMovement} />
      </div>
    </div>
  );
}
