import React, { useEffect, useRef, useState } from 'react';
import css from './index.module.scss';
import ColorPicker from '../../atoms/colorPicker';
import Input from '../../atoms/input';
import MarkersList from '../markersList';

interface FunctionRef {
  value: string;
  interval: number;
  pointsSize: number;
}

interface FunctionFormProps {
  functionsRef: React.MutableRefObject<{ interval: number }>;
  functionRef: React.MutableRefObject<FunctionRef>;
  colorRef: React.MutableRefObject<string>;
  setCameraPosition?: (...args: unknown[]) => void;
}

function FunctionForm({ functionsRef, functionRef, colorRef, setCameraPosition }: FunctionFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasLimites, setHasLimites] = useState(false);

  const [interval, setInterval] = useState(functionsRef.current.interval || 10);
  const [pointsSize, setPointsSize] = useState(
    functionRef.current.pointsSize || 50,
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value.includes('^')) {
      setHasLimites(true);
    }
    functionRef.current.value = e.target.value;
  }

  useEffect(() => {
    functionRef.current.interval = interval;
  }, [interval]);

  useEffect(() => {
    functionRef.current.pointsSize = pointsSize;
  }, [pointsSize]);

  return (
    <div className={css['functions-form_container']}>
      <form className={css['function-form_container']}>
        <Input
          id="function-form-input"
          className={css['function-form-input']}
          inputRef={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          placeholder="Ex: f(x) = x^2 + 3x - 2"
          onChange={handleChange}
          label="Insira a função:"
        />
        {
          // hasLimites && <>
          <div className={css['function-form-limites_container']}>
            <label
              className={css['function-form-label']}
              htmlFor="interval-size-input"
            >
              Tamanho do intervalo:
            </label>
            <div className={css['limites-input-container']}>
              <Input
                id="interval-size-input"
                className={css['limite-input']}
                type="number"
                placeholder="Ex: 10"
                value={String(interval)}
                max={500}
                onChange={(e) => {
                  setInterval(Math.min(Number(e.target.value), 500));
                }}
              />
            </div>
            <div className={css['function-form-limites_container']}>
              <label
                className={css['function-form-label']}
                htmlFor="points-size-input"
              >
                Quantidade de pontos:
              </label>
              <Input
                id="points-size-input"
                className={css['limite-input']}
                type="number"
                placeholder="Ex: 50"
                value={String(pointsSize)}
                max={500}
                onChange={(e) => {
                  setPointsSize(Math.min(Number(e.target.value), 500));
                }}
              />
            </div>
          </div>
        }
        <ColorPicker colorRef={colorRef} />
      </form>

      {/*}<MarkersList setCameraPosition={setCameraPosition} markersRef={functionsRef} />*/}
    </div>
  );
}

export default FunctionForm;
