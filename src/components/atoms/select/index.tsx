import React from 'react';
import css from './index.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  id?: string;
  options?: SelectOption[];
  className?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  form?: string;
}

const Select = ({ label, id, options = [], className, ...props }: SelectProps) => {
  return (
    <div className={`${className} ${css["select-container"]}`}>
      {label && <label htmlFor={id} className={css["select-label"]}>{label}</label>}
      <select
        id={id}
        className={css["select"]}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
