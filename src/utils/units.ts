export type DistanceUnit = 'cm' | 'm' | 'km';
export type VelocityUnit = 'm/s' | 'km/h';

export const DISTANCE_FACTORS: Record<DistanceUnit, number> = {
  cm: 100,
  m: 1,
  km: 0.001,
};

export const VELOCITY_FACTORS: Record<VelocityUnit, number> = {
  'm/s': 1,
  'km/h': 3.6,
};

const DISTANCE_DECIMALS: Record<DistanceUnit, number> = {
  cm: 0,
  m: 2,
  km: 4,
};

const VELOCITY_DECIMALS: Record<VelocityUnit, number> = {
  'm/s': 2,
  'km/h': 1,
};

export function toDisplayDistance(siValue: number, unit: DistanceUnit): number {
  return siValue * DISTANCE_FACTORS[unit];
}

export function fromDisplayDistance(displayValue: number, unit: DistanceUnit): number {
  return displayValue / DISTANCE_FACTORS[unit];
}

export function toDisplayVelocity(siValue: number, unit: VelocityUnit): number {
  return siValue * VELOCITY_FACTORS[unit];
}

export function fromDisplayVelocity(displayValue: number, unit: VelocityUnit): number {
  return displayValue / VELOCITY_FACTORS[unit];
}

export function formatDistance(siValue: number, unit: DistanceUnit): string {
  const display = toDisplayDistance(siValue, unit);
  return `${display.toFixed(DISTANCE_DECIMALS[unit])} ${unit}`;
}

export function formatVelocity(siValue: number, unit: VelocityUnit): string {
  const display = toDisplayVelocity(siValue, unit);
  return `${display.toFixed(VELOCITY_DECIMALS[unit])} ${unit}`;
}
