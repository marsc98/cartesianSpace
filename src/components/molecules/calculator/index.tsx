import React, { useState, useEffect, useRef } from 'react';
import css from './index.module.scss';
import Button from '../../atoms/button';
import Icon from '../../atoms/icon';

interface WorkerResponse {
  result?: string;
  error?: string;
}

interface CalculatorProps {
  textRef?: React.MutableRefObject<{ value: string } | null>;
  axle?: 'x' | 'y' | 'z';
  setAxisEquations?: React.Dispatch<React.SetStateAction<{ x: string; y: string; z: string }>>;
  writingRef?: React.MutableRefObject<boolean>;
}

export default function Calculator({
  textRef,
  axle,
  setAxisEquations,
  writingRef,
}: CalculatorProps) {
  const [input, setInput] = useState('0');
  const [result, setResult] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addToInput = (value: string) => {
    setError(false);
    setResult('');

    const inputElement = inputRef.current;
    if (inputElement) {
      const start = inputElement.selectionStart ?? input.length;
      const end = inputElement.selectionEnd ?? input.length;
      const beforeCursor = input.slice(0, start);
      const afterCursor = input.slice(end);

      const newInput = beforeCursor + value + afterCursor;
      setInput(newInput);

      if (typeof setAxisEquations === 'function' && axle) {
        setAxisEquations((prevAxisEquations) => ({
          ...prevAxisEquations,
          [axle]: newInput,
        }));
      }

      setTimeout(() => {
        const newPosition = start + value.length;
        inputElement.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const clearInput = () => {
    setInput('');
    setResult('');
    setError(false);
  };

  const backspace = () => {
    const inputElement = inputRef.current;
    if (inputElement) {
      const start = inputElement.selectionStart ?? input.length;
      const end = inputElement.selectionEnd ?? input.length;

      if (start !== end) {
        const newInput = input.slice(0, start) + input.slice(end);
        setInput(newInput);
        setTimeout(() => {
          inputElement.setSelectionRange(start, start);
        }, 0);
      } else if (start > 0) {
        const newInput = input.slice(0, start - 1) + input.slice(start);
        setInput(newInput);
        setTimeout(() => {
          inputElement.setSelectionRange(start - 1, start - 1);
        }, 0);
      }
    }
  };

  const calculate = () => {
    let expression = input
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/PI/g, 'pi')
      .replace(/E(?![a-z])/gi, 'e')
      .replace(/\^/g, '^')
      .replace(/√/g, 'sqrt');

    const MATH_SAFE_PATTERN = /^[0-9xyzt\s\+\-\*\/\^\(\)\.\,sincotgalbeqrtpifΔvagαβθωλπ%!\[\]×÷√E]+$/i;

    if (!MATH_SAFE_PATTERN.test(expression) || expression.length > 200) {
      setResult('Erro: Expressão inválida');
      setError(true);
      return;
    }

    const worker = new Worker(
      new URL('./math-worker.ts', import.meta.url),
      { type: 'module' },
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      setResult('Erro: Expressão muito complexa');
      setError(true);
    }, 2000);

    worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeout);
      worker.terminate();
      const { result: workerResult, error: workerError } = e.data;
      if (workerError) {
        setResult('Erro: Expressão inválida');
        setError(true);
        return;
      }
      if (textRef?.current) {
        textRef.current.value = `${expression} \n= ${workerResult}`;
      }
      setResult(workerResult ?? '');
      setError(false);
    });

    worker.addEventListener('error', () => {
      clearTimeout(timeout);
      worker.terminate();
      setResult('Erro: Expressão inválida');
      setError(true);
    });

    worker.postMessage({ expression } satisfies { expression: string });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value || '');
    setError(false);
    setResult('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      calculate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearInput();
    }
  };

  useEffect(() => {
    if (writingRef && !writingRef.current) {
      writingRef.current = true;
    }
    return () => {
      if (writingRef) writingRef.current = false;
    };
  }, []);

  return (
    <div className={css['calculator-container']}>
      <div className={css['calculator-card']}>
        <div className={css['display-frame']}>
          <div className={css['display-screen']}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={css['display-input']}
            />
            <div
              className={`${css['display-result']} ${error ? css['error'] : ''}`}
            >
              {result && (result.startsWith('Erro') ? result : `= ${result}`)}
            </div>
          </div>
        </div>

        <div className={css['buttons-grid']}>
          <Button action={() => addToInput('sin(')} color="orange" className={css['btn-function']} text="sin" />
          <Button action={() => addToInput('cos(')} color="orange" className={css['btn-function']} text="cos" />
          <Button action={() => addToInput('tan(')} color="orange" className={css['btn-function']} text="tan" />
          <Button action={() => addToInput('log(')} color="orange" className={css['btn-function']} text="log" />
          <Button action={() => addToInput('ln(')} color="orange" className={css['btn-function']} text="ln" />

          <Button action={() => addToInput('asin(')} color="orange" className={css['btn-function']} text="sin⁻¹" />
          <Button action={() => addToInput('acos(')} color="orange" className={css['btn-function']} text="cos⁻¹" />
          <Button action={() => addToInput('atan(')} color="orange" className={css['btn-function']} text="tan⁻¹" />
          <Button action={() => addToInput('sqrt(')} color="orange" className={css['btn-function']} text="√" />
          <Button action={() => addToInput('^')} color="orange" className={css['btn-function']} text="x^y" />

          <Button action={() => addToInput('abs(')} color="orange" className={css['btn-function']} text="|x|" />
          <Button action={() => addToInput('π')} color="orange" className={css['btn-function']} text="π" />
          <Button action={() => addToInput('E')} color="orange" className={css['btn-function']} text="e" />
          <Button action={() => addToInput('Δ')} color="purple" text="Δ" />
          <Button action={() => addToInput('v')} color="purple" text="v" />
          <Button action={() => addToInput('a')} color="purple" text="a" />
          <Button action={() => addToInput('t')} color="purple" text="t" />
          <Button action={() => addToInput('g')} color="purple" text="g" />

          <Button action={() => addToInput('α')} color="purple" text="α" />
          <Button action={() => addToInput('β')} color="purple" text="β" />
          <Button action={() => addToInput('θ')} color="purple" text="θ" />
          <Button action={() => addToInput('ω')} color="purple" text="ω" />
          <Button action={() => addToInput('λ')} color="purple" text="λ" />
          <Button action={() => addToInput('(')} color="blue" className={css['btn-operator']} text="(" />
          <Button action={() => addToInput(')')} color="blue" className={css['btn-operator']} text=")" />
          <Button action={() => addToInput('[')} color="blue" text="[" />
          <Button action={() => addToInput(']')} color="blue" text="]" />
          <Button action={() => addToInput('%')} color="blue" className={css['btn-operator']} text="%" />
          <Button action={() => addToInput('b')} color="blue" text="b" />
          <Button action={() => addToInput('c')} color="blue" text="c" />

          <Button action={() => addToInput('7')} className={css['btn-number']} text="7" />
          <Button action={() => addToInput('8')} className={css['btn-number']} text="8" />
          <Button action={() => addToInput('9')} className={css['btn-number']} text="9" />
          <Button action={() => addToInput('/')} color="blue" className={css['btn-operator']} text="÷" />
          <Button action={clearInput} color="red" text="C" />

          <Button action={() => addToInput('4')} className={css['btn-number']} text="4" />
          <Button action={() => addToInput('5')} className={css['btn-number']} text="5" />
          <Button action={() => addToInput('6')} className={css['btn-number']} text="6" />
          <Button action={() => addToInput('*')} color="blue" className={css['btn-operator']} text="×" />
          <Button action={backspace} color="red" className={css['btn-clear']} text={<Icon name="backspace" />} />

          <Button action={() => addToInput('1')} className={css['btn-number']} text="1" />
          <Button action={() => addToInput('2')} className={css['btn-number']} text="2" />
          <Button action={() => addToInput('3')} className={css['btn-number']} text="3" />
          <Button action={() => addToInput('-')} color="blue" className={css['btn-operator']} text="−" />
          <Button action={() => addToInput('!')} color="orange" className={css['btn-function']} text="x!" />

          <Button action={() => addToInput('0')} className={css['btn-number']} text="0" />
          <Button action={() => addToInput('.')} className={css['btn-number']} text="." />
          <Button action={() => addToInput(',')} className={css['btn-operator']} text="," />
          <Button action={() => addToInput('+')} color="blue" className={css['btn-operator']} text="+" />
          <Button action={calculate} className={css['btn-equals']} text="=" />
        </div>
      </div>
    </div>
  );
}
