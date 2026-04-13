import React from 'react';
import { useCoordinates } from '../../../hooks/contexts/SessionContext';
import { useUnits } from '../../../hooks/contexts/UnitsContext';
import { formatDistance } from '../../../utils/units';
import styles from './index.module.scss';

export function CoordinatesHUD(): JSX.Element | null {
  const { worldCoordinates } = useCoordinates();
  const { distanceUnit } = useUnits();

  if (worldCoordinates === null) return null;

  const { x, y, z } = worldCoordinates;

  return (
    <div className={styles.hud}>
      x: {formatDistance(x, distanceUnit)}&nbsp;&nbsp;&nbsp;
      y: {formatDistance(y, distanceUnit)}&nbsp;&nbsp;&nbsp;
      z: {formatDistance(z, distanceUnit)}
    </div>
  );
}
