import React from 'react';
import css from './index.module.scss';

interface CalibrationButtonProps {
  onCalibrate: () => void;
  className?: string;
}

export function CalibrationButton({ onCalibrate, className }: CalibrationButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={`${css['calibration-btn']} ${className ?? ''}`}
      onClick={onCalibrate}
    >
      Calibrar
    </button>
  );
}
