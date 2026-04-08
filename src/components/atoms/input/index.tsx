import React from 'react';
import css from './index.module.scss';

interface InputProps {
  label?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  onKeypress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  accept?: string;
  "aria-required"?: boolean | 'true' | 'false' | string;
}

const Input = ({ label, id, type = 'text', placeholder, value, onChange, inputRef, className, onKeypress, min, max, step, disabled, accept, "aria-required": ariaRequired }: InputProps) => {

  return (
    <div className={`${className} ${css["input-container"]}`} >
      {label && <label htmlFor={id} className={css["input-label"]}>{label}</label>}
      <input
        ref={inputRef}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        accept={accept}
        aria-required={ariaRequired}
        className={css["input"]}
        onKeyDown={(e) => {
          if (typeof onKeypress === 'function') onKeypress(e);
          e.stopPropagation();
        }}
      />
    </div>
  );
};

export default Input;
