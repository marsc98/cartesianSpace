import React, { useState } from 'react';
import { useUnits } from '../../../hooks/contexts/UnitsContext';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import {
  toDisplayVelocity,
  fromDisplayVelocity,
  type DistanceUnit,
  type VelocityUnit,
} from '../../../utils/units';
import Select from '../../atoms/select';
import Input from '../../atoms/input';
import styles from './index.module.scss';

const DISTANCE_OPTIONS = [
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'km', label: 'km' },
];

const VELOCITY_OPTIONS = [
  { value: 'm/s', label: 'm/s' },
  { value: 'km/h', label: 'km/h' },
];

export function UnitSettingsModal() {
  const { distanceUnit, velocityUnit, setDistanceUnit, setVelocityUnit } = useUnits();
  const { speedRefectorRef } = useCamera();

  const [localDistUnit, setLocalDistUnit] = useState<DistanceUnit>(distanceUnit);
  const [localVelUnit, setLocalVelUnit] = useState<VelocityUnit>(velocityUnit);
  const [localSpeed, setLocalSpeed] = useState<number>(
    toDisplayVelocity(speedRefectorRef.current, velocityUnit),
  );

  const handleVelUnitChange = (newUnit: VelocityUnit) => {
    const siSpeed = fromDisplayVelocity(localSpeed, localVelUnit);
    setLocalSpeed(toDisplayVelocity(siSpeed, newUnit));
    setLocalVelUnit(newUnit);
  };

  const speedIsInvalid = localSpeed <= 0 || !isFinite(localSpeed);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (speedIsInvalid) return;
    setDistanceUnit(localDistUnit);
    setVelocityUnit(localVelUnit);
    speedRefectorRef.current = fromDisplayVelocity(localSpeed, localVelUnit);
  };

  return (
    <form id="unit-settings-form" className={styles.container} onSubmit={handleSubmit}>
      <Select
        label="Distância"
        options={DISTANCE_OPTIONS}
        value={localDistUnit}
        onChange={(e) => setLocalDistUnit(e.target.value as DistanceUnit)}
      />

      <Select
        label="Unidade de velocidade"
        options={VELOCITY_OPTIONS}
        value={localVelUnit}
        onChange={(e) => handleVelUnitChange(e.target.value as VelocityUnit)}
      />

      <div className={styles.field}>
        <label className={styles.label}>Velocidade da câmera</label>
        <div className={styles.row}>
          <Input
            type="number"
            min={0.01}
            step={0.1}
            value={String(localSpeed)}
            onChange={(e) => setLocalSpeed(parseFloat(e.target.value))}
          />
          <span className={styles.unit}>{localVelUnit}</span>
        </div>
        {speedIsInvalid && (
          <span className={styles.error}>Velocidade deve ser maior que zero</span>
        )}
      </div>

    </form>
  );
}
