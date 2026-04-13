import { describe, it, expect } from 'vitest';
import {
  toDisplayDistance,
  fromDisplayDistance,
  toDisplayVelocity,
  fromDisplayVelocity,
  formatDistance,
  formatVelocity,
} from './units';

describe('toDisplayDistance', () => {
  it('converts SI to cm', () => expect(toDisplayDistance(1, 'cm')).toBe(100));
  it('converts SI to m', () => expect(toDisplayDistance(1, 'm')).toBe(1));
  it('converts SI to km', () => expect(toDisplayDistance(1, 'km')).toBe(0.001));
});

describe('fromDisplayDistance', () => {
  it('converts cm to SI', () => expect(fromDisplayDistance(100, 'cm')).toBe(1));
  it('converts m to SI', () => expect(fromDisplayDistance(1, 'm')).toBe(1));
  it('converts km to SI', () => expect(fromDisplayDistance(1, 'km')).toBe(1000));
});

describe('toDisplayVelocity', () => {
  it('converts SI to m/s', () => expect(toDisplayVelocity(1, 'm/s')).toBe(1));
  it('converts SI to km/h', () => expect(toDisplayVelocity(1, 'km/h')).toBe(3.6));
});

describe('fromDisplayVelocity', () => {
  it('converts m/s to SI', () => expect(fromDisplayVelocity(1, 'm/s')).toBe(1));
  it('converts km/h to SI', () => expect(fromDisplayVelocity(36, 'km/h')).toBe(10));
});

describe('formatDistance', () => {
  it('formats cm with 0 decimals', () => expect(formatDistance(1, 'cm')).toBe('100 cm'));
  it('formats m with 2 decimals', () => expect(formatDistance(2.5, 'm')).toBe('2.50 m'));
  it('formats km with 4 decimals', () => expect(formatDistance(1, 'km')).toBe('0.0010 km'));
});

describe('formatVelocity', () => {
  it('formats m/s with 2 decimals', () => expect(formatVelocity(1, 'm/s')).toBe('1.00 m/s'));
  it('formats km/h with 1 decimal', () => expect(formatVelocity(1, 'km/h')).toBe('3.6 km/h'));
});
