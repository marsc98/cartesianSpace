import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeGetParsed, safeSetItem } from '../../utils/storage';
import type { DistanceUnit, VelocityUnit } from '../../utils/units';
import { toDisplayDistance, fromDisplayDistance, toDisplayVelocity, fromDisplayVelocity } from '../../utils/units';

const STORAGE_KEY = 'units_preference';

interface UnitsPreference {
  distanceUnit: DistanceUnit;
  velocityUnit: VelocityUnit;
}

interface UnitsContextValue {
  distanceUnit: DistanceUnit;
  velocityUnit: VelocityUnit;
  setDistanceUnit: (u: DistanceUnit) => void;
  setVelocityUnit: (u: VelocityUnit) => void;
  toDisplay: (value: number, type: 'distance' | 'velocity') => number;
  fromDisplay: (value: number, type: 'distance' | 'velocity') => number;
}

const DISTANCE_UNITS: DistanceUnit[] = ['cm', 'm', 'km'];
const VELOCITY_UNITS: VelocityUnit[] = ['m/s', 'km/h'];

function isUnitsPreference(v: unknown): v is UnitsPreference {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    DISTANCE_UNITS.includes(obj.distanceUnit as DistanceUnit) &&
    VELOCITY_UNITS.includes(obj.velocityUnit as VelocityUnit)
  );
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

export const UnitsProvider = ({ children }: { children: React.ReactNode }) => {
  const stored = safeGetParsed<UnitsPreference>(STORAGE_KEY, isUnitsPreference);

  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(stored?.distanceUnit ?? 'm');
  const [velocityUnit, setVelocityUnit] = useState<VelocityUnit>(stored?.velocityUnit ?? 'm/s');

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify({ distanceUnit, velocityUnit }));
  }, [distanceUnit, velocityUnit]);

  const value = useMemo<UnitsContextValue>(
    () => ({
      distanceUnit,
      velocityUnit,
      setDistanceUnit,
      setVelocityUnit,
      toDisplay: (v, type) =>
        type === 'distance' ? toDisplayDistance(v, distanceUnit) : toDisplayVelocity(v, velocityUnit),
      fromDisplay: (v, type) =>
        type === 'distance' ? fromDisplayDistance(v, distanceUnit) : fromDisplayVelocity(v, velocityUnit),
    }),
    [distanceUnit, velocityUnit],
  );

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
};

export const useUnits = (): UnitsContextValue => {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
};
