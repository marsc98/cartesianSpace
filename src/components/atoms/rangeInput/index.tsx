import React, { useState, useEffect } from 'react';
import css from './index.module.scss';

interface RangeInputProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  setElementSize?: (size: number) => void;
  onValueChange?: (value: number) => void;
  label?: string;
  id?: string;
  sizeRef: React.MutableRefObject<number>;
  min: number;
  max: number;
  colorRef?: React.MutableRefObject<string>;
  className?: string;
  shouldRotate?: boolean;
  thumbIcon?: string;
}

const RangeInput = ({ isMobile, setElementSize, onValueChange, label, id, sizeRef, min, max, colorRef, className, shouldRotate = false, thumbIcon, ...props }: RangeInputProps) => {
  const [size, setSize] = useState<string | number>(sizeRef.current || 20);

  useEffect(() => {
    sizeRef.current = Number(size) || 0;
  }, [size, sizeRef]);

  const handleChange = (value: string) => {
    setSize(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setElementSize?.(numValue);
      onValueChange?.(numValue);
    }
  };

  const handleBlur = () => {
    let numValue = parseInt(String(size), 10);
    if (isNaN(numValue)) numValue = min;
    const clamped = Math.max(min, Math.min(max, numValue));
    setSize(clamped);
    setElementSize?.(clamped);
    onValueChange?.(clamped);
  };

  const decrease = () => setSize(prev => {
    const next = Math.max(min, Number(prev) - 1);
    setElementSize?.(next);
    onValueChange?.(next);
    return next;
  });

  const increase = () => setSize(prev => {
    const next = Math.min(max, Number(prev) + 1);
    setElementSize?.(next);
    onValueChange?.(next);
    return next;
  });

  return (
    <div className={`${css["range-input-container"]} ${className}`} {...props}>
      {label && (
        <label htmlFor={`${id}-number`} className={css["input-label"]}>
          <input
            id={`${id}-number`}
            className={css["transparent-number-input"]}
            type="number"
            min={min}
            max={max}
            value={Number(size).toFixed(2).toString()}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
          />
          <span className={css["label-text"]}>{label}</span>
        </label>
      )}

      <div className={css["range-controls"]}>
        <button style={{ rotate: shouldRotate ? '90deg' : undefined }} type="button" onClick={decrease} className={css["range-btn"]}>-</button>
        <input
          className={`${css["range-input"]}${thumbIcon ? ` ${css["range-input--icon"]}` : ''}`}
          style={thumbIcon ? { '--thumb-icon': `url(${thumbIcon})` } as React.CSSProperties : undefined}
          type="range"
          id={id}
          min={min}
          max={max}
          step="any"
          value={size}
          onChange={e => handleChange(e.target.value)}
        />
        <button style={{ rotate: shouldRotate ? '90deg' : undefined }} type="button" onClick={increase} className={css["range-btn"]}>+</button>
      </div>
    </div>
  );
};

export default RangeInput;
