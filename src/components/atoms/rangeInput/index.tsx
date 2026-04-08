import React, { useState, useEffect } from 'react';
import css from './index.module.scss';

interface RangeInputProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  setElementSize?: (size: number) => void;
  label?: string;
  id?: string;
  sizeRef: React.MutableRefObject<number>;
  min: number;
  max: number;
  colorRef?: React.MutableRefObject<string>;
  className?: string;
  shouldRotate?: boolean;
}

const RangeInput = ({ isMobile, setElementSize, label, id, sizeRef, min, max, colorRef, className, shouldRotate = false, ...props }: RangeInputProps) => {
  const [size, setSize] = useState(sizeRef.current || 20);

  useEffect(() => {
    sizeRef.current = Number(size);
  }, [size, sizeRef]);

  const handleChange = (value: string | number) => {
    if (value === '') {
      setSize(0);
      if (typeof setElementSize === 'function') {
        setElementSize(0);
      }
      return;
    }

    const numValue = parseInt(String(value), 10); // mantém parseInt como no original
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      if (typeof setElementSize === 'function') {
        setElementSize(numValue);
      }
      setSize(numValue);
    }
  };


  const decrease = () => setSize(prev => Math.max(min, parseInt(prev, 10) - 1));
  const increase = () => setSize(prev => Math.min(max, parseInt(prev, 10) + 1));

  return (
    <div className={`${css["range-input-container"]} ${className}`} {...props}>
      {/* {label && (
        <label htmlFor={id} className={css["input-label"]}>
          {label} {size}
        </label>
      )} */}

      <div className={css["range-controls"]}>
        <button style={{ rotate: shouldRotate && '90deg' }} type="button" onClick={decrease} className={css["range-btn"]}>-</button>
        <input
          className={css["range-input"]}
          type="range"
          id={id}
          min={min}
          max={max}
          step="any"
          value={size}
          onChange={e => handleChange(e.target.value)}
        />
        <button type="button" onClick={increase} className={css["range-btn"]}>+</button>
      </div>
    </div>
  );
};

export default RangeInput;
