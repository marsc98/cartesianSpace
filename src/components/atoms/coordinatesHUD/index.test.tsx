import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoordinatesHUD } from './index';

vi.mock('../../../hooks/contexts/SessionContext', () => ({
  useCoordinates: vi.fn(),
}));

vi.mock('../../../hooks/contexts/UnitsContext', () => ({
  useUnits: vi.fn(),
}));

import { useCoordinates } from '../../../hooks/contexts/SessionContext';
import { useUnits } from '../../../hooks/contexts/UnitsContext';

const mockUseCoordinates = useCoordinates as ReturnType<typeof vi.fn>;
const mockUseUnits = useUnits as ReturnType<typeof vi.fn>;

describe('CoordinatesHUD', () => {
  it('renderiza null quando worldCoordinates é null', () => {
    mockUseCoordinates.mockReturnValue({ worldCoordinates: null });
    mockUseUnits.mockReturnValue({ distanceUnit: 'm' });
    const { container } = render(<CoordinatesHUD />);
    expect(container.firstChild).toBeNull();
  });

  it('exibe valores em metros', () => {
    mockUseCoordinates.mockReturnValue({ worldCoordinates: { x: 1, y: 2, z: 3 } });
    mockUseUnits.mockReturnValue({ distanceUnit: 'm' });
    render(<CoordinatesHUD />);
    expect(screen.getByText(/x:.*1\.00 m/)).toBeInTheDocument();
    expect(screen.getByText(/y:.*2\.00 m/)).toBeInTheDocument();
    expect(screen.getByText(/z:.*3\.00 m/)).toBeInTheDocument();
  });

  it('exibe valores em cm', () => {
    mockUseCoordinates.mockReturnValue({ worldCoordinates: { x: 1, y: 0, z: 0 } });
    mockUseUnits.mockReturnValue({ distanceUnit: 'cm' });
    render(<CoordinatesHUD />);
    expect(screen.getByText(/x:.*100 cm/)).toBeInTheDocument();
  });

  it('exibe valores em km', () => {
    mockUseCoordinates.mockReturnValue({ worldCoordinates: { x: 1000, y: 0, z: 0 } });
    mockUseUnits.mockReturnValue({ distanceUnit: 'km' });
    render(<CoordinatesHUD />);
    expect(screen.getByText(/x:.*1\.0000 km/)).toBeInTheDocument();
  });
});
